using Abp.Auditing;
using Abp.EntityFrameworkCore;
using PMS.DataAccess;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Threading.Tasks;

namespace PMS.EntityFrameworkCore.Repositories;

public class DynamicRepository : PMSRepositoryBase<AuditLog, long>, IDynamicRepository
{
    public DynamicRepository(IDbContextProvider<PMSDbContext> dbContextProvider) : base(dbContextProvider)
    {
    }

    public async Task<List<dynamic>> ExecuteSqlAsync(string sql)
    {
        var connectionString = base.GetContext().Database.GetConnectionString();

        await using var connection = new SqlConnection(connectionString);
        await using var command = new SqlCommand(sql, connection)
        {
            CommandType = CommandType.Text
        };

        await connection.OpenAsync();
        // Detect if it's a SELECT query (basic check)
        if (sql.TrimStart().StartsWith("SELECT", System.StringComparison.OrdinalIgnoreCase))
        {
            var results = new List<dynamic>();
            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var row = new ExpandoObject() as IDictionary<string, object>;

                for (int i = 0; i < reader.FieldCount; i++)
                {
                    row[reader.GetName(i)] = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                }

                results.Add(row);
            }

            return results; // Returns List<dynamic>
        }
        else
        {
            var sqlUppercase = sql.ToUpper();
            if ((sqlUppercase.Contains("DELETE") || sqlUppercase.Contains("UPDATE")) && !sqlUppercase.Contains("WHERE"))
            {
                throw new Exception("DELETE and UPDATE statements must have a WHERE clause.");
            }

            // For UPDATE, INSERT, DELETE, etc.
            int affectedRows = await command.ExecuteNonQueryAsync();

            var results = new List<dynamic>();
            var row = new ExpandoObject() as IDictionary<string, object>;
            row["AffectedRows"] = affectedRows;
            results.Add(row);
            return results; // Returns number of affected rows
        }
    }
}

