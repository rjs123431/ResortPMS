using Abp.BackgroundJobs;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Extensions;
using Abp.Net.Mail;
using PMS.Authorization.Users;
using System.Net.Mail;
using System.Threading.Tasks;

namespace PMS.Common.Jobs
{
    public class SendEmailJob(
        IRepository<User, long> userRepository,
        IEmailSender emailSender)
        : AsyncBackgroundJob<SendEmailJobArgs>, ITransientDependency
    {
        [UnitOfWork]
        public override async Task ExecuteAsync(SendEmailJobArgs args)
        {
            try
            {
                var email = new MailMessage
                {
                    To = { args.Recipient },
                    Subject = args.Subject,
                    Body = args.Body,
                    IsBodyHtml = true
                };

                if (args.SenderUserId.HasValue)
                {
                    var senderUser = await userRepository.GetAsync(args.SenderUserId.Value);

                    email.From = new MailAddress(senderUser.EmailAddress, senderUser.Name);
                }

                if (!args.SenderEmailAddress.IsNullOrWhiteSpace())
                {
                    email.From = new MailAddress(args.SenderEmailAddress, args.SenderName);
                }

                await emailSender.SendAsync(email);
            }
            catch (System.Exception)
            {
                // ignored
            }
        }
    }
}





