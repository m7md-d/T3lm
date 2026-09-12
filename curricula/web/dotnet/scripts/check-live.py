from pathlib import Path
import subprocess, os, json, urllib.request, urllib.error, base64
project=Path(__file__).resolve().parents[1]/'project'
env=os.environ.copy();env.update(DOTNET_CLI_HOME='/tmp/t3lm-dotnet-home',NUGET_PACKAGES='/tmp/t3lm-nuget-packages',DOTNET_ROOT='/tmp/t3lm-dotnet-sdk',DOTNET_CLI_TELEMETRY_OPTOUT='1')
tokens={}
for actor in ['1','3']:
 r=subprocess.run(['/tmp/t3lm-dotnet-sdk/dotnet','user-jwts','create','--project','src/TeamBoard.Api','--name',actor,'--audience','http://localhost:5080','--output','json'],cwd=project,env=env,text=True,capture_output=True)
 if r.returncode:raise RuntimeError('Could not create development token: '+r.stderr)
 data=json.loads(r.stdout)
 token=data.get('Token') or data.get('token')
 if not token:raise RuntimeError('Token not found in JSON output; keys='+str(list(data)))
 claims=json.loads(base64.urlsafe_b64decode(token.split('.')[1]+'==='))
 assert claims['sub']==actor, 'Development subject contract mismatch'
 tokens[actor]=token
Path('/tmp/t3lm-verification-tokens.json').write_text(json.dumps(tokens))
os.chmod('/tmp/t3lm-verification-tokens.json',0o600)
print('Created local verification tokens for subjects 1 and 3; tokens not printed.')
