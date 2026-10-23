export { };

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}


async function loginAndGetCookie(email: string, role: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password:
        email === 'admin@campushms.local'
          ? 'Campus@123'
          : 'CampusHMS@2026',
      portalRole: role,
    }),
  });

  const cookie = res.headers.get('set-cookie');

  if (!cookie) {
    throw new Error(
      `Failed to login for ${email} with role ${role}, status: ${res.status}`
    );
  }

  const match = cookie.match(/hms_session=([^;]+)/);
  return match ? `hms_session=${match[1]}` : cookie;
}

async function runPhase82Tests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 8.2: FINANCE & ACCOUNTS MANAGEMENT TESTS');
  console.log('====================================================\n');

  let financeCookie = '';
  let adminCookie = '';
  let studentCookie = '';
  let parentCookie = '';
  let wardenCookie = '';
  let securityCookie = '';
  let maintenanceCookie = '';

  try {
    financeCookie = await loginAndGetCookie('finance@campushms.local', 'FINANCE');
    adminCookie = await loginAndGetCookie('admin@campushms.local', 'SUPER_ADMIN');
    studentCookie = await loginAndGetCookie('student@campushms.local', 'STUDENT');
    parentCookie = await loginAndGetCookie('parent@campushms.local', 'PARENT');
    wardenCookie = await loginAndGetCookie('warden@campushms.local', 'WARDEN');
    securityCookie = await loginAndGetCookie('security@campushms.local', 'SECURITY');
    maintenanceCookie = await loginAndGetCookie('maintenance@campushms.local', 'MAINTENANCE');
    assert(true, 'Authentication established for Finance, Admin, Student, Parent, Warden, Security, and Maintenance');
  } catch (err) {
    console.error('Login setup failed:', err);
    process.exit(1);
  }

  // ==========================================
  // 1. ROLE-BASED ACCESS CONTROL ON FINANCE APIS
  // ==========================================
  console.log('\n--- 1. ROLE-BASED ACCESS CONTROL ON FINANCE APIS ---');
  try {
    // 1.1 Unauthenticated requests blocked (401)
    const unauthRes = await fetch(`${BASE_URL}/api/finance/fees`);
    assert(unauthRes.status === 401, '1.1 Unauthenticated request blocked from /api/finance/fees (HTTP 401)');

    // 1.2 Finance staff permitted on overview & fees
    const financeOverviewRes = await fetch(`${BASE_URL}/api/finance/overview`, {
      headers: { Cookie: financeCookie },
    });
    assert(financeOverviewRes.status === 200, '1.2 Finance staff permitted on /api/finance/overview (HTTP 200)');

    const financeFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: financeCookie },
    });
    assert(financeFeesRes.status === 200, '1.2 Finance staff permitted on /api/finance/fees (HTTP 200)');

    // 1.3 Super Admin permitted on all finance endpoints
    const adminFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminFeesRes.status === 200, '1.3 Super Admin permitted on /api/finance/fees (HTTP 200)');

    // 1.4 Student permitted on own fees and receipts
    const studentFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: studentCookie },
    });
    assert(studentFeesRes.status === 200, '1.4 Student permitted on /api/finance/fees for self records (HTTP 200)');

    // 1.5 Parent permitted on ward's fees
    const parentFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: parentCookie },
    });
    assert(parentFeesRes.status === 200, '1.5 Parent permitted on /api/finance/fees for linked ward (HTTP 200)');

    // 1.6 Security staff strictly denied on fees & payments (403)
    const secFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: securityCookie },
    });
    assert(secFeesRes.status === 403, '1.6 Security staff strictly denied on /api/finance/fees (RBAC 403)');

    const secPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      headers: { Cookie: securityCookie },
    });
    assert(secPayRes.status === 403, '1.6 Security staff strictly denied on /api/finance/payments (RBAC 403)');

    // 1.7 Maintenance staff strictly denied on fees & payments (403)
    const maintFeesRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      headers: { Cookie: maintenanceCookie },
    });
    assert(maintFeesRes.status === 403, '1.7 Maintenance staff strictly denied on /api/finance/fees (RBAC 403)');

    // 1.8 Warden denied general financial management writes
    const wardenCreateFeeRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        feeType: 'Hostel Fee',
        amount: 30000,
        dueDate: '2026-11-30',
      }),
    });
    assert(wardenCreateFeeRes.status === 403, '1.8 Warden denied unrestricted fee creation writes (RBAC 403)');

    const wardenRecordPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        feeId: 'f-3',
        amount: 5000,
        paymentMethod: 'UPI',
      }),
    });
    assert(wardenRecordPayRes.status === 403, '1.8 Warden denied payment recording writes (RBAC 403)');
  } catch (err) {
    assert(false, `RBAC tests failed: ${err}`);
  }

  // ==========================================
  // 2. CROSS-STUDENT PRIVACY & IDOR ACCESS RESTRICTIONS
  // ==========================================
  console.log('\n--- 2. CROSS-STUDENT PRIVACY & IDOR ACCESS RESTRICTIONS ---');
  try {
    // 2.1 Student attempting to view another student's fees by ID parameter is blocked
    const studentCrossRes = await fetch(`${BASE_URL}/api/finance/fees?studentId=STU2024051`, {
      headers: { Cookie: studentCookie },
    });
    assert(studentCrossRes.status === 403, '2.1 Student cross-record fee access blocked (IDOR 403)');

    // 2.2 Parent attempting to view unlinked student fees is blocked
    const parentCrossRes = await fetch(`${BASE_URL}/api/finance/fees?studentId=STU2024051`, {
      headers: { Cookie: parentCookie },
    });
    assert(parentCrossRes.status === 403, '2.2 Parent cross-student fee access blocked (IDOR 403)');

    // 2.3 Student attempting to access other student payment receipt is blocked
    const crossReceiptRes = await fetch(`${BASE_URL}/api/finance/receipts/REC-2024-8804`, {
      headers: { Cookie: studentCookie },
    });
    assert(crossReceiptRes.status === 404, '2.3 Student accessing other student receipt returns 404 Not Found / Access Denied');
  } catch (err) {
    assert(false, `Cross-student privacy tests failed: ${err}`);
  }

  // ==========================================
  // 3. FEE DEMAND CREATION & VALIDATION
  // ==========================================
  console.log('\n--- 3. FEE DEMAND CREATION & VALIDATION ---');
  const runId = Date.now().toString().slice(-5);
  const testStudentId = `STU_${runId}`;
  let testFeeId = '';
  let testInvoiceNum = '';
  try {
    // 3.1 Invalid fee amount (<= 0) rejected
    const invalidAmountRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        feeType: 'Hostel Fee',
        amount: -1000,
        dueDate: '2026-11-30',
      }),
    });
    assert(invalidAmountRes.status === 400, '3.1 Invalid fee amount (negative) rejected (HTTP 400)');

    const zeroAmountRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        feeType: 'Hostel Fee',
        amount: 0,
        dueDate: '2026-11-30',
      }),
    });
    assert(zeroAmountRes.status === 400, '3.1 Invalid fee amount (zero) rejected (HTTP 400)');

    // 3.2 Missing student ID rejected
    const missingStuRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        studentId: '',
        feeType: 'Mess Fee',
        amount: 15000,
        dueDate: '2026-11-30',
      }),
    });
    assert(missingStuRes.status === 400, '3.2 Missing student ID rejected (HTTP 400)');

    // 3.3 Valid fee creation by authorized Finance staff
    const validFeeRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        studentId: testStudentId,
        feeType: 'Hostel Fee',
        amount: 40000,
        dueDate: '2026-11-30',
        academicTerm: `Semester_${runId}`,
        description: 'New resident semester accommodation fee',
      }),
    });
    const feeData = await validFeeRes.json();
    assert(validFeeRes.status === 201, '3.3 Finance staff can create fee demand (HTTP 201)');
    assert(feeData.fee?.amount === 40000, '3.3 Created fee amount matches ₹40,000');
    assert(feeData.fee?.paidAmount === 0, '3.3 Initial paidAmount is 0');
    assert(feeData.fee?.balanceDue === 40000, '3.3 Initial balanceDue equals full amount');
    assert(feeData.fee?.status === 'Pending', '3.3 Initial status is Pending');
    assert(!!feeData.fee?.invoiceNumber, '3.3 Unique invoice number generated');
    testFeeId = feeData.fee?.id;
    testInvoiceNum = feeData.fee?.invoiceNumber;

    // 3.4 Duplicate fee demand for same student and term rejected
    const dupFeeRes = await fetch(`${BASE_URL}/api/finance/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        studentId: testStudentId,
        feeType: 'Hostel Fee',
        amount: 40000,
        dueDate: '2026-11-30',
        academicTerm: `Semester_${runId}`,
      }),
    });
    assert(dupFeeRes.status === 400, '3.4 Duplicate active fee demand rejected (HTTP 400)');
  } catch (err) {
    assert(false, `Fee demand creation tests failed: ${err}`);
  }

  // ==========================================
  // 4. PAYMENT RECORDING, PARTIAL PAYMENTS & OVERPAYMENT REJECTION
  // ==========================================
  console.log('\n--- 4. PAYMENT RECORDING, PARTIAL PAYMENTS & OVERPAYMENT REJECTION ---');
  let firstReceiptNo = '';
  let secondReceiptNo = '';
  try {
    // 4.1 Invalid payment amount (<= 0) rejected
    const invalidPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: -500,
        paymentMethod: 'UPI',
      }),
    });
    assert(invalidPayRes.status === 400, '4.1 Invalid negative payment amount rejected (HTTP 400)');

    // 4.2 Overpayment rejection: Trying to pay ₹50,000 when balance is ₹40,000
    const overpayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: 50000,
        paymentMethod: 'UPI',
        transactionReference: `UPI/OVERPAY/${runId}`,
      }),
    });
    assert(overpayRes.status === 400, '4.2 Overpayment exceeding balance due rejected (HTTP 400)');

    // 4.3 Valid Partial Payment: Pay ₹15,000 of ₹40,000
    const partialPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: 15000,
        paymentMethod: 'UPI',
        transactionReference: `UPI/PARTIAL/${runId}`,
      }),
    });
    const partialData = await partialPayRes.json();
    assert(partialPayRes.status === 201, '4.3 Partial payment recorded successfully (HTTP 201)');
    assert(partialData.fee?.paidAmount === 15000, '4.3 Fee paidAmount incremented to ₹15,000');
    assert(partialData.fee?.balanceDue === 25000, '4.3 Fee balanceDue reduced to ₹25,000');
    assert(partialData.fee?.status === 'Partially Paid', '4.3 Fee status transitioned to Partially Paid');
    assert(!!partialData.receipt?.receiptNumber, '4.3 Unique receipt generated for partial payment');
    firstReceiptNo = partialData.receipt?.receiptNumber;

    // 4.4 Duplicate transaction reference protection
    const dupTxnRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: 5000,
        paymentMethod: 'UPI',
        transactionReference: `UPI/PARTIAL/${runId}`, // duplicate reference
      }),
    });
    assert(dupTxnRes.status === 400, '4.4 Duplicate transaction reference rejected (HTTP 400)');

    // 4.5 Second partial payment overpayment check: Trying to pay ₹26,000 when balance is ₹25,000
    const secondOverpayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: 26000,
        paymentMethod: 'Net Banking',
        transactionReference: `HDFC/NEFT/OVERPAY_${runId}`,
      }),
    });
    assert(secondOverpayRes.status === 400, '4.5 Second overpayment rejected when exceeding updated balance (HTTP 400)');

    // 4.6 Full settlement payment: Pay remaining ₹25,000
    const fullPayRes = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        feeId: testFeeId,
        amount: 25000,
        paymentMethod: 'Net Banking',
        transactionReference: `HDFC/NEFT/FINAL_${runId}`,
      }),
    });
    const fullPayData = await fullPayRes.json();
    assert(fullPayRes.status === 201, '4.6 Full settlement payment recorded (HTTP 201)');
    assert(fullPayData.fee?.paidAmount === 40000, '4.6 Total paidAmount reached full fee ₹40,000');
    assert(fullPayData.fee?.balanceDue === 0, '4.6 Balance due reduced to exactly ₹0 (no negative balance)');
    assert(fullPayData.fee?.status === 'Paid', '4.6 Fee status transitioned to Paid');
    assert(!!fullPayData.receipt?.receiptNumber, '4.6 Second unique receipt generated for final settlement');
    secondReceiptNo = fullPayData.receipt?.receiptNumber;
    assert(firstReceiptNo !== secondReceiptNo, '4.6 Distinct receipt numbers generated for separate transactions');
  } catch (err) {
    assert(false, `Payment recording tests failed: ${err}`);
  }

  // ==========================================
  // 5. INVOICES RETRIEVAL & LINE ITEM BREAKDOWN
  // ==========================================
  console.log('\n--- 5. INVOICES RETRIEVAL & LINE ITEM BREAKDOWN ---');
  try {
    const invoicesRes = await fetch(`${BASE_URL}/api/finance/invoices`, {
      headers: { Cookie: financeCookie },
    });
    const invData = await invoicesRes.json();
    assert(invoicesRes.status === 200, '5.1 Invoices API returns HTTP 200');
    assert(Array.isArray(invData.invoices), '5.1 Invoices returned as array');

    // Find test invoice
    const targetInv = invData.invoices.find((i: any) => i.id === testFeeId || i.invoiceNumber === testInvoiceNum);
    assert(!!targetInv, '5.2 Created fee is listed in invoices ledger');
    assert(targetInv.status === 'Paid', '5.2 Invoice reflects settled Paid status');
    assert(Array.isArray(targetInv.lineItems) && targetInv.lineItems.length > 0, '5.2 Invoice includes line items breakdown');
    assert(targetInv.totalAmount === 40000, '5.2 Invoice total amount verified');
    assert(targetInv.balanceDue === 0, '5.2 Invoice balance due is 0');

    // 5.3 Fetch single invoice by ID
    const singleInvRes = await fetch(`${BASE_URL}/api/finance/invoices/${testFeeId}`, {
      headers: { Cookie: financeCookie },
    });
    assert(singleInvRes.status === 200, '5.3 Get invoice by ID returns HTTP 200');
    const singleInvData = await singleInvRes.json();
    assert(singleInvData.invoice?.invoiceNumber === testInvoiceNum, '5.3 Single invoice detail matches invoiceNumber');
  } catch (err) {
    assert(false, `Invoices retrieval tests failed: ${err}`);
  }

  // ==========================================
  // 6. DISCIPLINARY FINES LIFECYCLE & INTEGRITY
  // ==========================================
  console.log('\n--- 6. DISCIPLINARY FINES LIFECYCLE & INTEGRITY ---');
  let testFineId = '';
  try {
    // 6.1 Warden can issue fine with valid inputs
    const issueFineRes = await fetch(`${BASE_URL}/api/finance/fines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        category: 'Curfew Violation',
        reason: 'Unauthorized late return at 11:15 PM without signed pass',
        amount: 750,
      }),
    });
    const fineData = await issueFineRes.json();
    assert(issueFineRes.status === 201, '6.1 Warden can issue disciplinary fine (HTTP 201)');
    assert(fineData.fine?.status === 'PENDING', '6.1 Initial fine status is PENDING');
    assert(fineData.fine?.amount === 750, '6.1 Fine amount matches ₹750');
    testFineId = fineData.fine?.id;

    // 6.2 Student blocked from issuing fine
    const studentIssueFineRes = await fetch(`${BASE_URL}/api/finance/fines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        studentId: 'STU2024018',
        category: 'Discipline',
        reason: 'Student attempted fine',
        amount: 500,
      }),
    });
    assert(studentIssueFineRes.status === 403, '6.2 Student blocked from issuing fines (RBAC 403)');

    // 6.3 Warden blocked from settling fine (unrestricted write protection)
    const wardenPayFineRes = await fetch(`${BASE_URL}/api/finance/fines/${testFineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        action: 'pay',
        paymentMethod: 'Cash',
      }),
    });
    assert(wardenPayFineRes.status === 403, '6.3 Warden blocked from settling fine (RBAC 403)');

    // 6.4 Finance staff settles fine payment
    const financePayFineRes = await fetch(`${BASE_URL}/api/finance/fines/${testFineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        action: 'pay',
        paymentMethod: 'UPI',
        transactionReference: 'UPI/FINE/SETTLE771',
      }),
    });
    const payFineData = await financePayFineRes.json();
    assert(financePayFineRes.status === 200, '6.4 Finance staff can settle fine (HTTP 200)');
    assert(payFineData.fine?.status === 'PAID', '6.4 Fine status transitioned to PAID');
    assert(!!payFineData.payment?.receiptNumber, '6.4 Fine settlement created auditable payment and receipt');

    // 6.5 Cannot settle an already paid fine (duplicate protection)
    const secondPayFineRes = await fetch(`${BASE_URL}/api/finance/fines/${testFineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        action: 'pay',
        paymentMethod: 'UPI',
      }),
    });
    assert(secondPayFineRes.status === 400, '6.5 Cannot settle an already paid fine (HTTP 400)');

    // 6.6 Issue second fine to test waiver
    const secondFineRes = await fetch(`${BASE_URL}/api/finance/fines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        category: 'Noise Complaint',
        reason: 'Loud music past curfew hours',
        amount: 300,
      }),
    });
    const secondFineData = await secondFineRes.json();
    const waiveFineId = secondFineData.fine?.id;

    // 6.7 Finance staff waives fine with recorded reason
    const waiveFineRes = await fetch(`${BASE_URL}/api/finance/fines/${waiveFineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        action: 'waive',
        reason: 'First warning forgiven on written resident undertaking',
      }),
    });
    const waivedData = await waiveFineRes.json();
    assert(waiveFineRes.status === 200, '6.7 Finance staff can waive fine on administrative review (HTTP 200)');
    assert(waivedData.fine?.status === 'WAIVED', '6.7 Fine status updated to WAIVED');

    // 6.8 Cannot pay a waived fine
    const payWaivedRes = await fetch(`${BASE_URL}/api/finance/fines/${waiveFineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: financeCookie },
      body: JSON.stringify({
        action: 'pay',
        paymentMethod: 'UPI',
      }),
    });
    assert(payWaivedRes.status === 400, '6.8 Cannot pay a waived disciplinary fine (HTTP 400)');
  } catch (err) {
    assert(false, `Fines lifecycle tests failed: ${err}`);
  }

  // ==========================================
  // 7. RECEIPTS ARCHIVE & PRINTABLE VOUCHERS
  // ==========================================
  console.log('\n--- 7. RECEIPTS ARCHIVE & PRINTABLE VOUCHERS ---');
  try {
    const receiptsRes = await fetch(`${BASE_URL}/api/finance/receipts`, {
      headers: { Cookie: financeCookie },
    });
    const recData = await receiptsRes.json();
    assert(receiptsRes.status === 200, '7.1 Receipts API returns HTTP 200');
    assert(Array.isArray(recData.receipts), '7.1 Receipts returned as array');

    // 7.2 Fetch single receipt by receiptNumber
    const singleReceiptRes = await fetch(`${BASE_URL}/api/finance/receipts/${firstReceiptNo}`, {
      headers: { Cookie: financeCookie },
    });
    assert(singleReceiptRes.status === 200, '7.2 Fetch receipt by receipt number returns HTTP 200');
    const singleRecData = await singleReceiptRes.json();
    assert(singleRecData.receipt?.receiptNumber === firstReceiptNo, '7.2 Receipt number matches');
    assert(!!singleRecData.receipt?.amountInWords, '7.2 Receipt includes amount formatted in words (Indian Rupees)');
    assert(singleRecData.receipt?.amount === 15000, '7.2 Receipt amount matches recorded payment');
    assert(singleRecData.receipt?.status === 'VERIFIED', '7.2 Receipt status is VERIFIED');
  } catch (err) {
    assert(false, `Receipts archive tests failed: ${err}`);
  }

  // ==========================================
  // 8. FINANCE PAGE ROUTE SEPARATION
  // ==========================================
  console.log('\n--- 8. FINANCE PAGE ROUTE SEPARATION ---');
  try {
    const routes = ['/finance', '/fees', '/invoices', '/payments', '/fines', '/receipts'];
    for (const r of routes) {
      const res = await fetch(`${BASE_URL}${r}`, {
        headers: { Cookie: financeCookie },
      });
      assert(res.status === 200, `8.1 Route ${r} returns HTTP 200 OK`);
    }
  } catch (err) {
    assert(false, `Route separation tests failed: ${err}`);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n====================================================');
  console.log(`PHASE 8.2 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');

  if (failed > 0) {
    console.error(`❌ ${failed} tests failed in Phase 8.2 suite.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 8.2 FINANCE & ACCOUNTS TESTS COMPLETED AND VERIFIED SUCCESSFULLY!');
  }
}

runPhase82Tests().catch((e) => {
  console.error('Phase 8.2 execution error:', e);
  process.exit(1);
});
