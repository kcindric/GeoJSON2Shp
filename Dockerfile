FROM mcr.microsoft.com/dotnet/core/aspnet:3.0-buster-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/core/sdk:3.0-buster AS build
WORKDIR /src
COPY ["GeoJSON2Shp.csproj", "GeoJSON2Shp/"]
RUN dotnet restore "GeoJSON2Shp/GeoJSON2Shp.csproj"
COPY . ./GeoJSON2Shp/
WORKDIR "/src/GeoJSON2Shp"
RUN dotnet build "GeoJSON2Shp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GeoJSON2Shp.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GeoJSON2Shp.dll"]