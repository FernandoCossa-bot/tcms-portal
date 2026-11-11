// Compatibility adapter for the original module's existing RPC interface.
// All business operations still reach the module gateway and server authorization.
export async function nativeLogisticsRpc(request,name,p={}){
 switch(name){
 case 'get_my_role': {const a=await request('access');if(!a.allowed)throw Error('Inventory access is not assigned.');return {role_name:a.role,role_code:a.role,level_number:a.level};}
 case 'get_stock':case 'list_items':return request('stock');
 case 'list_movements':return request('movements');
 case 'add_item':return request('add_item',{name:p.p_name});
 case 'add_movement':return request('add_movement',{item_id:p.p_item_id,movement_type:p.p_movement_type,quantity:p.p_quantity});
 case 'update_movement':return request('edit_movement',{id:p.p_id,quantity:p.p_quantity,previous_quantity:p.p_previous_quantity});
 case 'list_accounts_with_roles':return (await request('queue')).map(a=>({email:a.email||a.display_name,role_name:a.role_code||a.status}));
 case 'list_history':{const [history,accounts]=await Promise.all([request('audit'),request('queue')]);return history.map(h=>({target_email:accounts.find(a=>a.portal_id===h.target)?.email||accounts.find(a=>a.portal_id===h.target)?.display_name||h.target,action:h.action,new_role:h.details?.role||'',changed_at:h.created_at}));}
 case 'assign_role':case 'revoke_role':{
  const accounts=await request('queue');const email=String(p.p_email||'').trim().toLowerCase();
  const a=accounts.find(a=>a.email&&a.email.toLowerCase()===email);
  if(!a)throw Error('No verified Portal request for this email. Ask the user to request access in the Portal.');
  return request('decide',{portal_id:a.portal_id,version:a.version,status:name==='assign_role'?'approved':'revoked',role:p.p_role_code||a.role_code,reason:'Access updated in the original Item Movement application.'});
 }
 default:throw Error('Unsupported module operation.');
 }
}
