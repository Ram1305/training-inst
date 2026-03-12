const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john@test.com');
formData.append('phone', '0400000000');
formData.append('australianStudentId', 'AUS123456');
formData.append('streetAddress', '123 Test St');
formData.append('city', 'Sydney');
formData.append('state', 'NSW');
formData.append('postcode', '2000');
formData.append('paymentMethod', 'CreditCard');
formData.append('totalAmount', '150');
formData.append('transactionId', 'CC_TEST123');
formData.append('selectedCourses', JSON.stringify([
    {
        courseId: '00000000-0000-0000-0000-000000000000',
        courseName: 'Test Course',
        price: 150
    }
]));

fetch('https://safety-academy-api-afh9eua2ctege9bz.australiasoutheast-01.azurewebsites.net/api/VOC/submit', {
    method: 'POST',
    body: formData
}).then(res => res.json().then(data => ({status: res.status, data})))
  .then(console.log)
  .catch(console.error);
