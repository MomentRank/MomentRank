FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY MomentRank.sln .
COPY MomentRank/MomentRank.csproj MomentRank/
COPY MomentRank.UnitTests/MomentRank.UnitTests.csproj MomentRank.UnitTests/
COPY MomentRank.IntegrationTests/MomentRank.IntegrationTests.csproj MomentRank.IntegrationTests/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . .

# Build the application
RUN dotnet build -c Release

# Publish the application
RUN dotnet publish MomentRank/MomentRank.csproj -c Release -o /app/publish --no-build

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "MomentRank.dll"]
