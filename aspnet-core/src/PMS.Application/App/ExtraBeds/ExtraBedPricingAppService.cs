using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.ExtraBeds.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.ExtraBeds;

public interface IExtraBedPricingAppService : IApplicationService
{
    Task<List<ExtraBedPriceDto>> GetByTypeAsync(GetExtraBedPricesByTypeInput input);
    Task<List<ExtraBedCurrentPriceDto>> GetCurrentPricesAsync(GetCurrentExtraBedPricesInput input);
    Task<Guid> CreateAsync(CreateExtraBedPriceDto input);
    Task UpdateAsync(UpdateExtraBedPriceDto input);
}

[AbpAuthorize]
public class ExtraBedPricingAppService(
    IRepository<ExtraBedPrice, Guid> extraBedPriceRepository,
    IRepository<ExtraBedType, Guid> extraBedTypeRepository
) : PMSAppServiceBase, IExtraBedPricingAppService
{
    /// <summary>Returns the full pricing history for a single extra-bed type.</summary>
    public async Task<List<ExtraBedPriceDto>> GetByTypeAsync(GetExtraBedPricesByTypeInput input)
    {
        var rows = await extraBedPriceRepository.GetAll()
            .Where(x => x.ExtraBedTypeId == input.ExtraBedTypeId)
            .OrderByDescending(x => x.EffectiveFrom)
            .ToListAsync();

        var typeName = await extraBedTypeRepository.GetAll()
            .Where(x => x.Id == input.ExtraBedTypeId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync() ?? string.Empty;

        return rows.Select(r => MapDto(r, typeName)).ToList();
    }

    /// <summary>
    /// Returns the currently-effective rate for every active extra-bed type,
    /// resolved to <paramref name="input.AsOfDate"/> (defaults to today).
    /// Only extra-bed types that have an effective price for the given date are returned.
    /// </summary>
    public async Task<List<ExtraBedCurrentPriceDto>> GetCurrentPricesAsync(GetCurrentExtraBedPricesInput input)
    {
        var asOf = (input.AsOfDate ?? DateTime.Today).Date;

        var activeTypes = await extraBedTypeRepository.GetAll()
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync();

        var typeIds = activeTypes.Select(x => x.Id).ToList();

        // Fetch all active pricing rows for active types at once
        var priceRows = await extraBedPriceRepository.GetAll()
            .Where(x => typeIds.Contains(x.ExtraBedTypeId)
                     && x.IsActive
                     && x.EffectiveFrom <= asOf
                     && (x.EffectiveTo == null || x.EffectiveTo.Value > asOf))
            .ToListAsync();

        // Per type, pick the most-recently-started effective row
        var result = new List<ExtraBedCurrentPriceDto>();
        var typeNames = activeTypes.ToDictionary(x => x.Id, x => x.Name);

        foreach (var type in activeTypes)
        {
            var row = priceRows
                .Where(x => x.ExtraBedTypeId == type.Id)
                .OrderByDescending(x => x.EffectiveFrom)
                .FirstOrDefault();

            if (row != null)
            {
                result.Add(new ExtraBedCurrentPriceDto
                {
                    ExtraBedTypeId   = type.Id,
                    ExtraBedTypeName = type.Name,
                    RatePerNight     = row.RatePerNight,
                });
            }
        }

        return result;
    }

    public async Task<Guid> CreateAsync(CreateExtraBedPriceDto input)
    {
        var type = await extraBedTypeRepository.FirstOrDefaultAsync(input.ExtraBedTypeId);
        if (type == null)
            throw new UserFriendlyException("Extra bed type not found.");

        ValidateDateRange(input.EffectiveFrom, input.EffectiveTo);

        var entity = new ExtraBedPrice
        {
            ExtraBedTypeId = input.ExtraBedTypeId,
            RatePerNight   = input.RatePerNight,
            EffectiveFrom  = input.EffectiveFrom.Date,
            EffectiveTo    = input.EffectiveTo.HasValue ? input.EffectiveTo.Value.Date : null,
            IsActive       = true,
        };

        return await extraBedPriceRepository.InsertAndGetIdAsync(entity);
    }

    public async Task UpdateAsync(UpdateExtraBedPriceDto input)
    {
        var entity = await extraBedPriceRepository.GetAsync(input.Id);

        ValidateDateRange(input.EffectiveFrom, input.EffectiveTo);

        entity.ExtraBedTypeId = input.ExtraBedTypeId;
        entity.RatePerNight   = input.RatePerNight;
        entity.EffectiveFrom  = input.EffectiveFrom.Date;
        entity.EffectiveTo    = input.EffectiveTo.HasValue ? input.EffectiveTo.Value.Date : null;
        entity.IsActive       = input.IsActive;

        await extraBedPriceRepository.UpdateAsync(entity);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static void ValidateDateRange(DateTime from, DateTime? to)
    {
        if (to.HasValue && to.Value.Date <= from.Date)
            throw new UserFriendlyException("Effective To must be after Effective From.");
    }

    private static ExtraBedPriceDto MapDto(ExtraBedPrice r, string typeName) =>
        new()
        {
            Id               = r.Id,
            ExtraBedTypeId   = r.ExtraBedTypeId,
            ExtraBedTypeName = typeName,
            RatePerNight     = r.RatePerNight,
            EffectiveFrom    = r.EffectiveFrom,
            EffectiveTo      = r.EffectiveTo,
            IsActive         = r.IsActive,
        };
}
