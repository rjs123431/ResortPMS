using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.App.Pos.Dto;
using PMS.Authorization;
using PMS.Authorization.Users;

namespace PMS.App.Pos;

public interface IPosSessionAppService : IApplicationService
{
    Task<List<PosSessionListDto>> GetMySessionsAsync();
    Task<Guid?> GetMyCurrentOpenSessionIdAsync();
    Task<Guid> OpenSessionAsync(OpenPosSessionInput input);
    Task CloseSessionAsync(ClosePosSessionInput input);
}

[AbpAuthorize(PermissionNames.Pages_POS)]
public class PosSessionAppService(
    IRepository<PosSession, Guid> sessionRepository,
    IRepository<PosOutlet, Guid> outletRepository,
    UserManager userManager
) : PMSAppServiceBase, IPosSessionAppService
{
    public async Task<List<PosSessionListDto>> GetMySessionsAsync()
    {
        var userId = AbpSession.UserId ?? 0L;
        var sessions = await sessionRepository.GetAll()
            .Include(s => s.Outlet)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.OpenedAt)
            .ToListAsync();

        var userIds = sessions.Select(s => s.UserId).Distinct().ToList();
        var userList = await userManager.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        var users = userList.ToDictionary(u => u.Id, u =>
        {
            var n = (u.Name + " " + u.Surname).Trim();
            return string.IsNullOrEmpty(n) ? (u.UserName ?? "") : n;
        });

        return sessions.Select(s => new PosSessionListDto
        {
            Id = s.Id,
            OutletId = s.OutletId,
            OutletName = s.Outlet?.Name ?? "",
            TerminalId = s.TerminalId,
            TerminalName = s.TerminalId,
            UserId = s.UserId,
            UserName = users.GetValueOrDefault(s.UserId, ""),
            OpenedAt = s.OpenedAt,
            ClosedAt = s.ClosedAt,
            OpeningCash = s.OpeningCash,
            ClosingCash = s.ClosingCash,
            ExpectedCash = s.ExpectedCash,
            CashDifference = s.CashDifference,
            Status = (int)s.Status,
        }).ToList();
    }

    public async Task<Guid?> GetMyCurrentOpenSessionIdAsync()
    {
        var userId = AbpSession.UserId ?? 0L;
        var session = await sessionRepository.FirstOrDefaultAsync(s =>
            s.UserId == userId && s.Status == PosSessionStatus.Open);
        return session?.Id;
    }

    public async Task<Guid> OpenSessionAsync(OpenPosSessionInput input)
    {
        var userId = AbpSession.UserId;
        if (!userId.HasValue)
            throw new UserFriendlyException("You must be logged in to open a POS session.");

        var hasOpen = await sessionRepository.GetAll()
            .AnyAsync(s => s.UserId == userId.Value && s.Status == PosSessionStatus.Open);
        if (hasOpen)
            throw new UserFriendlyException("You already have an open POS session. Close it before opening a new one.");

        await outletRepository.GetAsync(input.OutletId);

        var session = new PosSession
        {
            OutletId = input.OutletId,
            TerminalId = input.TerminalId.Trim(),
            UserId = userId.Value,
            OpenedAt = Clock.Now,
            OpeningCash = input.OpeningCash,
            Status = PosSessionStatus.Open,
        };
        await sessionRepository.InsertAsync(session);
        return session.Id;
    }

    public async Task CloseSessionAsync(ClosePosSessionInput input)
    {
        var userId = AbpSession.UserId;
        if (!userId.HasValue)
            throw new UserFriendlyException("You must be logged in to close a POS session.");

        PosSession session;
        if (input.SessionId.HasValue)
        {
            session = await sessionRepository.FirstOrDefaultAsync(s => s.Id == input.SessionId.Value);
            if (session == null)
                throw new UserFriendlyException("Session not found.");
            if (session.UserId != userId.Value)
                throw new UserFriendlyException("You can only close your own session.");
        }
        else
        {
            session = await sessionRepository.FirstOrDefaultAsync(s =>
                s.UserId == userId.Value && s.Status == PosSessionStatus.Open);
            if (session == null)
                throw new UserFriendlyException("You have no open POS session to close.");
        }

        if (session.Status != PosSessionStatus.Open)
            throw new UserFriendlyException("This session is already closed.");

        session.ClosingCash = input.ClosingCash;
        session.ExpectedCash = input.ClosingCash; // optional: could be computed from orders later
        session.CashDifference = 0;
        session.ClosedAt = Clock.Now;
        session.Status = PosSessionStatus.Closed;
        await sessionRepository.UpdateAsync(session);
    }
}
