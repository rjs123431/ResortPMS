# PMS – GitHub Copilot Instructions

> This file provides persistent context for GitHub Copilot across all files in this repository.
> Always read `Agents.MD` in the repo root for the complete project reference.

---

## Project Identity

- **Name**: PMS — a full-stack Property Management System for resorts
- **Backend**: .NET 9, ASP.NET Boilerplate (ABP Zero), EF Core, SQL Server
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, PWA
- **Architecture**: Modular Monolith, multi-tenant

---

## Absolute Rules

1. **Never scan source files to discover routes, entities, or service names** — all are documented in `Agents.MD` and `docs/`.
2. **Never use raw `dotnet ef`** — always use `./app migration add "Name"` from the repo root.
3. **Never add default exports** for page components — use named exports only.
4. **Never inline permissions as strings** — always use `PermissionNames.<Key>` from `react/src/config/permissionNames.ts`.
5. **Never skip the `pointer-events-none` pattern** on Headless UI dialogs — see `Agents.MD §UI Patterns`.
6. **Never use `cascade delete`** on FK relationships in EF Core — use `DeleteBehavior.Restrict`.

---

## Code Style

### TypeScript / React
- `React.FC<Props>` for component types
- Named exports: `export function MyPage()`
- Lazy load in `App.tsx`: `lazy(() => import(...).then(m => ({ default: m.MyPage })))`
- Path aliases: always use `@/`, `@pages/`, `@components/`, `@contexts/`
- Tailwind dark mode: always pair `text-gray-900 dark:text-white` etc.
- Primary color: `bg-primary-600 hover:bg-primary-700 text-white` for primary buttons
- Error display: SweetAlert2 (`Swal.fire(...)`) for user-facing errors and confirmations

### C# / .NET
- AppServices inherit from `PMSAppServiceBase`
- Always use `[UnitOfWork]` on create/update/delete methods
- Use `ObjectMapper.Map<>()` — never manual property assignment
- DTOs named: `{Entity}Dto`, `Create{Entity}Dto`, `Update{Entity}Dto`, `Get{Entities}Input`
- Validation via DataAnnotations: `[Required]`, `[MaxLength]`, `[Range]`

---

## Key Paths (Quick Reference)

| File/Folder | Purpose |
|---|---|
| `react/src/App.tsx` | All frontend routes |
| `react/src/config/permissionNames.ts` | All permission name constants |
| `react/src/types/resort.types.ts` | All hotel domain TypeScript types |
| `react/src/services/*.service.ts` | API service layer |
| `react/src/components/layout/` | All layout shell components |
| `react/src/pages/Resort/Shared/` | Reusable cross-feature dialogs |
| `aspnet-core/src/PMS.Core/App/` | All domain entities |
| `aspnet-core/src/PMS.Application/App/` | All AppServices and DTOs |
| `aspnet-core/src/PMS.EntityFrameworkCore/EntityFrameworkCore/PMSDbContext.cs` | All DbSets |
| `aspnet-core/src/PMS.EntityFrameworkCore/EntityFrameworkCore/Configurations/` | EF Core configs |
| `aspnet-core/src/PMS.Core/Authorization/AppAuthorizationProvider.cs` | All permissions |
| `aspnet-core/src/PMS.Application/CustomDtoMapper.cs` | All AutoMapper mappings |

---

## Development Commands

```bash
# From repo root:
./app migration add "MigrationName"   # Add EF Core migration
./app db update                       # Apply migrations
./app db reset                        # Drop + recreate DB

# Frontend (from react/):
npm run dev          # Dev server
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

---

## Patterns to Always Follow

### New Frontend Page
```tsx
// 1. Use named export
export function MyFeaturePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Feature</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Description.</p>
          </div>
        </div>
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {/* content */}
        </section>
      </div>
    </MainLayout>
  );
}
```

### New Backend AppService
```csharp
[AbpAuthorize(PermissionNames.Pages_MyFeature)]
public class MyFeatureAppService : PMSAppServiceBase, IMyFeatureAppService
{
    private readonly IRepository<MyEntity, int> _repository;

    public MyFeatureAppService(IRepository<MyEntity, int> repository)
    {
        _repository = repository;
    }

    [UnitOfWork]
    public async Task<MyEntityDto> CreateAsync(CreateMyEntityDto input)
    {
        var entity = ObjectMapper.Map<MyEntity>(input);
        var id = await _repository.InsertAndGetIdAsync(entity);
        await CurrentUnitOfWork.SaveChangesAsync();
        return ObjectMapper.Map<MyEntityDto>(await _repository.GetAsync(id));
    }
}
```

### New Entity
```csharp
public class MyEntity : FullAuditedEntity<int>, IPassivable
{
    public const int MaxNameLength = 200;
    public string Name { get; set; }
    public bool IsActive { get; set; } = true;
}
```

### EF Core Config
```csharp
public class MyEntityConfiguration : IEntityTypeConfiguration<MyEntity>
{
    public void Configure(EntityTypeBuilder<MyEntity> builder)
    {
        builder.ToTable("MyEntities");
        builder.Property(e => e.Name).HasMaxLength(MyEntity.MaxNameLength).IsUnicode(true);
        // Financial decimals:
        builder.Property(e => e.Amount).HasColumnType("decimal(18,4)");
        // FKs always Restrict:
        builder.HasOne(e => e.Parent).WithMany().HasForeignKey(e => e.ParentId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
```
