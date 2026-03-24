using Microsoft.AspNetCore.Http;
using Serilog.Context;
using System;
using System.Threading.Tasks;

namespace PMS.Web.Host.Startup;

/// <summary>
/// Propagates or generates an X-Correlation-Id header so that every request can be traced
/// across log entries. The ID is also pushed into Serilog's LogContext so every log line
/// written during the request automatically carries the CorrelationId property.
/// </summary>
public class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-Id";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue(HeaderName, out var incoming) ||
            string.IsNullOrWhiteSpace(incoming))
        {
            incoming = Guid.NewGuid().ToString("N");
        }

        var correlationId = incoming.ToString();
        context.Items[HeaderName] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
