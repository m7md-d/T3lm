import json, urllib.request, urllib.error
from pathlib import Path
tokens=json.loads(Path('/tmp/t3lm-verification-tokens.json').read_text())
base='http://localhost:5080'
def call(method,path,actor=None,body=None):
 headers={'Accept':'application/json'}
 if actor:headers['Authorization']='Bearer '+tokens[actor]
 data=None if body is None else json.dumps(body).encode()
 if data is not None:headers['Content-Type']='application/json'
 req=urllib.request.Request(base+path,data=data,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=10) as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as r:return r.code,r.read(),dict(r.headers)
def expect(method,path,expected,actor=None,body=None):
 code,data,headers=call(method,path,actor,body)
 assert code==expected,f'{method} {path}: expected {expected}, got {code}; {data[:150]}'
 print(f'{method} {path} → {code}')
 return data,headers
expect('GET','/health',200)
expect('GET','/tasks/1',401)
expect('GET','/tasks/1',200,'1')
expect('PATCH','/tasks/1/assignee',403,'3',{'userId':2})
expect('PATCH','/tasks/1/assignee',400,'1',{'userId':3})
expect('PATCH','/tasks/1/assignee',204,'1',{'userId':2})
data,_=expect('GET','/tasks/1',200,'1');assert json.loads(data)['assigneeId']==2
expect('POST','/projects/1/tasks',400,'1',{'title':'   '})
data,headers=expect('POST','/projects/1/tasks',201,'1',{'title':'  Verify PostgreSQL  '})
location=headers.get('Location') or headers.get('location');assert location
path=location.replace(base,'');data,_=expect('GET',path,200,'1');assert json.loads(data)['title']=='Verify PostgreSQL'
data,headers=expect('POST','/projects',201,'1',{'name':'Postgres sequence check'})
assert json.loads(data)['id']>2
print('Passed: live PostgreSQL + real development JWT + membership + persistence + creation.')
