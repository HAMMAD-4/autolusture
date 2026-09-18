import http from 'http';

function req(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { Accept: 'application/json', ...headers }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on('error', (e) => resolve({ status: 0, body: e.message, headers: {} }));
    if (body) r.write(body);
    r.end();
  });
}

async function verifyAll() {
  console.log('=== STARTING COMPREHENSIVE VERIFICATION ===');

  // 1. Check Public Booking Page HTML
  const bookingPage = await req('GET', '/booking');
  const has1HourGapText = bookingPage.body.includes('1-hour gap ensured between jobs');
  console.log(`1. '1-hour gap ensured between jobs' removed from /booking: ${!has1HourGapText ? 'PASS (Removed)' : 'FAIL (Still present)'}`);

  // 2. Check Footer Links removed
  const homePage = await req('GET', '/');
  const hasAdminLoginFooter = homePage.body.includes('Admin login') && homePage.body.includes('/admin');
  const hasRepPortalFooter = homePage.body.includes('Rep portal') && homePage.body.includes('/rep');
  console.log(`2. Footer portal links removed: ${!hasAdminLoginFooter && !hasRepPortalFooter ? 'PASS (Removed)' : 'FAIL'}`);

  // 3. Test Login with NEW ADMIN: hammad@admin.com / Admin123!
  const loginNewAdmin = await req('POST', '/api/auth/login', JSON.stringify({
    email: 'hammad@admin.com',
    password: 'Admin123!'
  }));
  const loginSuccess = loginNewAdmin.status === 200;
  console.log(`3. Login with hammad@admin.com: ${loginSuccess ? 'PASS (200 OK)' : 'FAIL (' + loginNewAdmin.status + ')'}`);
  const cookie = loginNewAdmin.headers['set-cookie']?.[0]?.split(';')[0] || '';

  // 4. Test Representatives API (GET)
  const repsGet = await req('GET', '/api/admin/reps', null, { Cookie: cookie });
  const repsData = JSON.parse(repsGet.body);
  console.log(`4. Reps API GET: ${repsGet.status === 200 ? 'PASS' : 'FAIL'} (Found ${repsData.representatives?.length} reps: ${repsData.representatives?.map(r=>r.full_name).join(', ')})`);

  // 5. Create Rep via API
  const createRep = await req('POST', '/api/admin/reps', JSON.stringify({
    full_name: 'Test Technician',
    email: 'testtech@autolustre.local',
    password: 'TechPassword!123'
  }), { Cookie: cookie });
  const createdRepData = JSON.parse(createRep.body);
  console.log(`5. Create Rep API POST: ${createRep.status === 201 ? 'PASS' : 'FAIL'} (id: ${createdRepData.id})`);

  // 6. Delete Test Rep
  if (createdRepData.id) {
    const delRep = await req('DELETE', '/api/admin/reps', JSON.stringify({ id: createdRepData.id }), { Cookie: cookie });
    console.log(`6. Delete Rep API DELETE: ${delRep.status === 200 ? 'PASS' : 'FAIL'}`);
  }

  // 7. Test Inventory API (GET)
  const invGet = await req('GET', '/api/admin/inventory', null, { Cookie: cookie });
  const invData = JSON.parse(invGet.body);
  const firstItem = invData.items?.[0];
  console.log(`7. Inventory API GET: ${invGet.status === 200 ? 'PASS' : 'FAIL'} (Found ${invData.items?.length} items)`);

  // 8. Test Quick Adjust Inventory Stock (+1 and -1)
  if (firstItem) {
    const oldQty = firstItem.on_hand;
    const adjustPlus = await req('PATCH', '/api/admin/inventory', JSON.stringify({
      id: firstItem.id,
      delta: 1
    }), { Cookie: cookie });
    const plusData = JSON.parse(adjustPlus.body);
    const newQty = plusData.item?.on_hand;
    console.log(`8. Quick Adjust (+1): ${adjustPlus.status === 200 && newQty === oldQty + 1 ? 'PASS' : 'FAIL'} (${oldQty} -> ${newQty})`);

    // Reset back
    const adjustMinus = await req('PATCH', '/api/admin/inventory', JSON.stringify({
      id: firstItem.id,
      delta: -1
    }), { Cookie: cookie });
    const minusData = JSON.parse(adjustMinus.body);
    console.log(`   Quick Adjust (-1): ${adjustMinus.status === 200 && minusData.item?.on_hand === oldQty ? 'PASS' : 'FAIL'} (${newQty} -> ${minusData.item?.on_hand})`);
  }

  // 9. Test Expenses API (GET & POST)
  const expGet = await req('GET', '/api/admin/expenses', null, { Cookie: cookie });
  const expData = JSON.parse(expGet.body);
  console.log(`9. Expenses API GET: ${expGet.status === 200 ? 'PASS' : 'FAIL'} (Total expenses: $${expData.totalExpenses})`);

  const addExp = await req('POST', '/api/admin/expenses', JSON.stringify({
    title: 'Testing supply verification',
    category: 'Consumables',
    amount: 45.00,
    expense_date: new Date().toISOString().slice(0, 10),
    vendor: 'AutoChem Sydney'
  }), { Cookie: cookie });
  const addExpData = JSON.parse(addExp.body);
  console.log(`10. Record Expense POST: ${addExp.status === 201 ? 'PASS' : 'FAIL'} (id: ${addExpData.id})`);

  // Clean up test expense
  if (addExpData.id) {
    await req('DELETE', '/api/admin/expenses', JSON.stringify({ id: addExpData.id }), { Cookie: cookie });
  }

  // 11. Test Financial Export (JSON report & CSV)
  const finReport = await req('GET', '/api/admin/export?type=finance&format=json', null, { Cookie: cookie });
  const finReportData = JSON.parse(finReport.body);
  console.log(`11. Financial Report API: ${finReport.status === 200 ? 'PASS' : 'FAIL'} (Inflow: $${finReportData.totalInflow}, Expense: $${finReportData.totalExpense}, Net: $${finReportData.netCashflow})`);

  const finCsv = await req('GET', '/api/admin/export?type=finance', null, { Cookie: cookie });
  console.log(`12. Financial Ledger CSV Export: ${finCsv.status === 200 && finCsv.headers['content-type']?.includes('text/csv') ? 'PASS (CSV received)' : 'FAIL'}`);

  // 13. Active Jobs API
  const activeJobs = await req('GET', '/api/admin/active-jobs', null, { Cookie: cookie });
  const activeJobsData = JSON.parse(activeJobs.body);
  console.log(`13. Active Jobs API: ${activeJobs.status === 200 ? 'PASS' : 'FAIL'} (Active bays: ${activeJobsData.activeJobsCount})`);

  // 14. Admin Profile API (GET & PATCH)
  const profileGet = await req('GET', '/api/admin/profile', null, { Cookie: cookie });
  const profileData = JSON.parse(profileGet.body);
  console.log(`14. Admin Profile GET: ${profileGet.status === 200 ? 'PASS' : 'FAIL'} (Admin name: ${profileData.profile?.full_name}, Email: ${profileData.profile?.email})`);

  // 15. Admin Services API (GET all 9 services)
  const servicesGet = await req('GET', '/api/admin/services', null, { Cookie: cookie });
  const servicesData = JSON.parse(servicesGet.body);
  console.log(`15. Admin Services API GET: ${servicesGet.status === 200 && servicesData.length >= 9 ? 'PASS' : 'FAIL'} (Found ${servicesData.length} services: ${servicesData.map(s => s.name).join(', ')})`);

  console.log('=== ALL VERIFICATIONS COMPLETE ===');
}

verifyAll().catch(console.error);
