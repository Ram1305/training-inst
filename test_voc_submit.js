async function testSubmit() {
    const data = new FormData();
    data.append('firstName', 'John');
    data.append('lastName', 'Doe');
    data.append('email', 'test@example.com');
    data.append('phone', '0400000000');
    data.append('australianStudentId', 'AUS-123');
    data.append('streetAddress', '123 Fake St');
    data.append('city', 'Sydney');
    data.append('state', 'NSW');
    data.append('postcode', '2000');
    data.append('totalAmount', '150');
    data.append('selectedCourses', JSON.stringify([{ courseId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', courseName: 'Test Course', price: 150 }]));
    data.append('paymentMethod', 'CreditCard');
    data.append('transactionId', 'CC_123456');
    // Add dummy file
    const fileContent = new Blob(['dummy content'], { type: 'text/plain' });
    data.append('paymentProof', fileContent, 'test.txt');
    
    try {
        const res = await fetch('http://localhost:5576/api/VOC/submit', {
            method: 'POST',
            body: data
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(err) {
        console.error(err);
    }
}

testSubmit();
