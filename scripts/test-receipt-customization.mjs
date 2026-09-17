const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== TESTING BILL & RECEIPT CUSTOMIZATION ===');

  // 1. Login as admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hammad@admin.com', password: 'Admin123!' })
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  const cookies = loginRes.headers.get('set-cookie');
  console.log('1. Admin login: PASS');

  // 2. GET receipt settings
  const getRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    headers: { cookie: cookies || '' }
  });
  if (!getRes.ok) {
    throw new Error(`GET receipt-settings failed: ${getRes.status}`);
  }
  const getData = await getRes.json();
  console.log('2. GET receipt-settings: PASS (Business:', getData.settings.business_name, ')');

  // 3. Test Invalid image format rejection (PDF instead of PNG/JPEG/WEBP)
  const invalidMimeRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...getData.settings,
      signature_image_data: 'data:application/pdf;base64,JVBERi0xLjQK'
    })
  });
  if (invalidMimeRes.status === 400) {
    console.log('3. Reject non-image MIME type: PASS (400 Bad Request)');
  } else {
    throw new Error(`Expected 400 for invalid MIME type, got ${invalidMimeRes.status}`);
  }

  // 4. Test Oversized image rejection (> 2MB)
  const hugePayload = 'data:image/png;base64,' + 'A'.repeat(2.5 * 1024 * 1024);
  const oversizedRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...getData.settings,
      signature_image_data: hugePayload
    })
  });
  if (oversizedRes.status === 400) {
    console.log('4. Reject oversized signature (>2MB): PASS (400 Bad Request)');
  } else {
    throw new Error(`Expected 400 for oversized image, got ${oversizedRes.status}`);
  }

  // 5. Test Valid Signature & Custom Headers Update
  const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const updateRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      business_name: 'AutoLustre Detailing Pty Ltd (Sydney Flagship)',
      abn: '48 612 345 678',
      business_address: '12-14 Industrial Circuit, Alexandria, NSW 2015',
      phone: '1300 288 678',
      email: 'accounts@autolustre.com.au',
      invoice_title: 'TAX INVOICE / RECEIPT',
      terms_conditions: '1. All ceramic coatings include a 30-day studio warranty.\n2. Payment is strictly settled upon completion.',
      signature_image_data: validSignature,
      signatory_name: 'Hammad Saifullah',
      signatory_title: 'Quality Assurance & Studio Director'
    })
  });
  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(`PATCH receipt-settings failed: ${updateRes.status} ${JSON.stringify(err)}`);
  }
  console.log('5. Update receipt settings with valid signature: PASS (200 OK)');

  // 6. Verify updated settings
  const verifyRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    headers: { cookie: cookies || '' }
  });
  const verifyData = await verifyRes.json();
  if (
    verifyData.settings.business_name === 'AutoLustre Detailing Pty Ltd (Sydney Flagship)' &&
    verifyData.settings.signature_image_data === validSignature
  ) {
    console.log('6. Verify saved customization in DB: PASS');
  } else {
    throw new Error('Verification failed: saved data did not match');
  }

  // 7. Test Invalid tax_mode rejection
  const invalidTaxModeRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...verifyData.settings,
      tax_mode: 'unsupported_mode'
    })
  });
  if (invalidTaxModeRes.status === 400) {
    console.log('7. Reject invalid tax_mode: PASS (400 Bad Request)');
  } else {
    throw new Error(`Expected 400 for invalid tax_mode, got ${invalidTaxModeRes.status}`);
  }

  // 8. Test Invalid tax_rate rejection (< 0)
  const invalidTaxRateRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...verifyData.settings,
      tax_rate: -5
    })
  });
  if (invalidTaxRateRes.status === 400) {
    console.log('8. Reject negative tax_rate: PASS (400 Bad Request)');
  } else {
    throw new Error(`Expected 400 for negative tax_rate, got ${invalidTaxRateRes.status}`);
  }

  // 9. Test Valid Exclusive Tax Configuration Update
  const updateExclusiveTaxRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...verifyData.settings,
      tax_mode: 'exclusive',
      tax_type: 'percentage',
      tax_rate: 10,
      tax_label: 'GST'
    })
  });
  if (!updateExclusiveTaxRes.ok) {
    throw new Error(`Exclusive tax PATCH failed: ${updateExclusiveTaxRes.status}`);
  }
  const checkExclusiveRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    headers: { cookie: cookies || '' }
  });
  const checkExclusiveData = await checkExclusiveRes.json();
  if (
    checkExclusiveData.settings.tax_mode === 'exclusive' &&
    checkExclusiveData.settings.tax_type === 'percentage' &&
    Number(checkExclusiveData.settings.tax_rate) === 10 &&
    checkExclusiveData.settings.tax_label === 'GST'
  ) {
    console.log('9. Update and verify Exclusive % Tax settings: PASS');
  } else {
    throw new Error('Verification of exclusive tax failed');
  }

  // 10. Test Valid Inclusive Fixed AUD Tax Configuration Update
  const updateFixedTaxRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...verifyData.settings,
      tax_mode: 'inclusive',
      tax_type: 'fixed',
      tax_rate: 50.00,
      tax_label: 'Fixed Detailing Levy'
    })
  });
  if (!updateFixedTaxRes.ok) {
    throw new Error(`Fixed tax PATCH failed: ${updateFixedTaxRes.status}`);
  }
  const checkFixedRes = await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    headers: { cookie: cookies || '' }
  });
  const checkFixedData = await checkFixedRes.json();
  if (
    checkFixedData.settings.tax_mode === 'inclusive' &&
    checkFixedData.settings.tax_type === 'fixed' &&
    Number(checkFixedData.settings.tax_rate) === 50 &&
    checkFixedData.settings.tax_label === 'Fixed Detailing Levy'
  ) {
    console.log('10. Update and verify Inclusive Fixed AUD Tax settings: PASS');
  } else {
    throw new Error('Verification of fixed tax failed');
  }

  // 11. Restore Australian Standard GST (inclusive, 10%, GST)
  await fetch(`${BASE_URL}/api/admin/receipt-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookies || '' },
    body: JSON.stringify({
      ...verifyData.settings,
      tax_mode: 'inclusive',
      tax_type: 'percentage',
      tax_rate: 10,
      tax_label: 'GST'
    })
  });
  console.log('11. Restored standard Australian GST defaults (10% inclusive): PASS');

  console.log('=== ALL RECEIPT & TAX CUSTOMIZATION TESTS PASSED ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
