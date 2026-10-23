import { it, expect, vi, beforeEach } from 'vitest';
import { createApiClient } from './api';
import { createDemoClient } from './demo';
beforeEach(()=>vi.restoreAllMocks());
it('sends bearer tokens and uses the search endpoint', async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});
  const client=createApiClient('/api',()=> 'token',()=>{},fetcher);
  await client.list({make:'BMW'});
  expect(fetcher.mock.calls[0][0]).toBe('/api/vehicles/search?make=BMW');
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
});
it('expires auth on 401 and preserves server conflict messages',async()=>{
  const expired=vi.fn();
  const fetcher=vi.fn().mockResolvedValue({ok:false,status:401,json:async()=>({error:{message:'Session expired'}})});
  await expect(createApiClient('/api',()=>null,expired,fetcher).list({})).rejects.toThrow('Session expired');
  expect(expired).toHaveBeenCalled();
});
it('demo prevents overselling and enforces admin actions',async()=>{
  const client=createDemoClient(()=>({role:'customer'}));
  await expect(client.purchase('ab-005')).rejects.toMatchObject({status:409});
  await expect(client.remove('ab-001')).rejects.toMatchObject({status:403});
});
it('demo purchases and restocks persist updated quantities',async()=>{
  const client=createDemoClient(()=>({role:'admin'}));
  expect((await client.purchase('ab-002')).quantity).toBe(0);
  expect((await client.restock('ab-002',3)).quantity).toBe(3);
  expect((await client.list({make:'Mercedes'}))[0].quantity).toBe(3);
});
it('demo rejects missing sessions and invalid restock quantities',async()=>{
  await expect(createDemoClient(()=>null).list({})).rejects.toMatchObject({status:401});
  await expect(createDemoClient(()=>({role:'admin'})).restock('ab-001',-2)).rejects.toMatchObject({status:400});
});
