const fetch = (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));

(async()=>{
  try{
  const email = `new.user.${Date.now()}@example.com`;
  const res = await fetch('http://localhost:3000/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'password123',name:'New User 2'})});
    console.log('STATUS',res.status);
    console.log('BODY',await res.text());
  }catch(e){
    console.error(e);
  }
})();
