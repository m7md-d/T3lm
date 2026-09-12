#!/bin/sh
set -eu
export DOTNET_CLI_HOME=/tmp/t3lm-dotnet-home
export NUGET_PACKAGES=/tmp/t3lm-nuget-packages
export DOTNET_ROOT=/tmp/t3lm-dotnet-sdk
export DOTNET_CLI_TELEMETRY_OPTOUT=1
case "${1:-}" in
  migrate)
    /tmp/t3lm-dotnet-sdk/dotnet tool restore
    ConnectionStrings__Board='Host=localhost;Port=5438;Database=teamboard;Username=teamboard;Password=local-lab-only' /tmp/t3lm-dotnet-sdk/dotnet ef migrations add InitialBoard --project src/TeamBoard.Infrastructure --startup-project src/TeamBoard.Api
    ConnectionStrings__Board='Host=localhost;Port=5438;Database=teamboard;Username=teamboard;Password=local-lab-only' /tmp/t3lm-dotnet-sdk/dotnet ef migrations script --project src/TeamBoard.Infrastructure --startup-project src/TeamBoard.Api --output /tmp/t3lm-initial-board.sql
    ConnectionStrings__Board='Host=localhost;Port=5438;Database=teamboard;Username=teamboard;Password=local-lab-only' /tmp/t3lm-dotnet-sdk/dotnet ef database update --project src/TeamBoard.Infrastructure --startup-project src/TeamBoard.Api
    ;;
  live)
    python3 ../scripts/check-live-http.py
    ;;
  jwt)
    python3 ../scripts/check-live.py
    ;;
  test)
    /tmp/t3lm-dotnet-sdk/dotnet test TeamBoard.slnx --nologo
    ;;
  stages)
    for stage in ../journey/*/reference; do
      /tmp/t3lm-dotnet-sdk/dotnet build "$stage/TeamBoard.slnx" --nologo --verbosity quiet
    done
    ;;
  run)
    ConnectionStrings__Board='Host=localhost;Port=5438;Database=teamboard;Username=teamboard;Password=local-lab-only' /tmp/t3lm-dotnet-sdk/dotnet run --project src/TeamBoard.Api --launch-profile Postgres --no-restore
    ;;
  *) exit 2;;
esac
