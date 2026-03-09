# PMS Management System

This is an PMS Management System built with **ASP.NET Boilerplate (ABP) Framework** using **ASP.NET Core 9.0** backend and **Angular 19** frontend.

For detailed project structure and architecture documentation, see [agents.md](./agents.md).

## Prerequisites

- .NET 9.0 SDK
- Node.js and Yarn (or npm)
- SQL Server
- Visual Studio 2019+ / Rider / VS Code

## .NET Core API Application

1. Open `aspnet-core/PMSPlus.sln` solution in Visual Studio 2019 v16.7+ (or Rider) and build the solution.
2. Select the `PMS.Web.Host` project as the startup project.
3. Create a file `appsettings.Development.json` in the `PMS.Web.Host` project, and add connection strings inside it:
```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost; Database=PMSDb-dev; Trusted_Connection=True;"
  }
}
```
4. Open the Package Manager Console and run an `Update-Database` command to create your database (ensure that the Default project is selected as `PMS.EntityFrameworkCore` in the Package Manager Console window).
5. Run the application. The API will be available at `http://localhost:22357/` (check `launchSettings.json` for actual port).
6. Default login credentials: `admin / Simple01` (check database seed data for actual credentials)

## Angular Application

1. Open command prompt/terminal and navigate to `angular` folder
2. Run the command `yarn install` (or `npm install`) to restore npm packages
3. Run the command `yarn start` (or `npm start`) to run the application
4. Once the application compiled, go to http://localhost:6100/ in your browser
5. Make sure `PMS.Web.Host` is also running

## API Client Generation

After making changes to backend API, regenerate the Angular API client services:
- **Windows**: `yarn nswag` or `npm run nswag`
- **Mac/Linux**: `yarn nswag:mac` or `npm run nswag:mac`

## Deployment

### Staging

1. Open Windows Powershell as administrator
2. Change directory to `aspnet-core/build`
3. Type `.\staging`, it will build and deploy files to a folder called `outputs-staging`
4. Wait for the build to complete
5. Open `aspnet-core/src/PMS.Migrator/bin/Debug/net9.0` in explorer
6. Modify `appsettings.json` connection string to target Staging database
7. Run `PMS.Migrator.exe` to run the migrations on Staging database
8. Test the system

## Project Structure

- `aspnet-core/` - ASP.NET Core backend solution (ABP Framework)
- `angular/` - Angular frontend application
- `docs/` - Project documentation

See [agents.md](./agents.md) for detailed architecture and structure documentation.
