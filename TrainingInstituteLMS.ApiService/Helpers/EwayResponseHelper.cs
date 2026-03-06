namespace TrainingInstituteLMS.ApiService.Helpers
{
    /// <summary>
    /// Helper class for parsing eWay response codes into user-friendly messages
    /// </summary>
    public static class EwayResponseHelper
    {
        public static string GetResponseDescription(string? responseCode)
        {
            if (string.IsNullOrEmpty(responseCode))
                return "Unknown error occurred";

            var fullDescription = responseCode switch
            {
                // Success Codes
                "A2000" => "Transaction Approved - Your payment was successful",
                "A2008" => "Honour With Identification - Payment approved",
                "A2010" => "Approved For Partial Amount - Payment partially approved",
                "A2011" => "Approved, VIP - Payment approved",
                "A2016" => "Approved, Update Track 3 - Payment approved",

                // Declined Codes
                "D4401" => "Refer to Issuer - Please contact your bank",
                "D4402" => "Refer to Issuer, Special - Please contact your bank",
                "D4403" => "No Merchant - Invalid merchant configuration",
                "D4404" => "Pick Up Card - Card has been flagged, contact your bank",
                "D4405" => "Do Not Honour - Transaction declined by your bank",
                "D4406" => "Error - Transaction error occurred",
                "D4407" => "Pick Up Card, Special - Card has been flagged",
                "D4409" => "Request In Progress - Please try again later",
                "D4412" => "Invalid Transaction - Transaction type not supported",
                "D4413" => "Invalid Amount - Payment amount is invalid",
                "D4414" => "Invalid Card Number - Please check your card number",
                "D4415" => "No Issuer - Card issuer not found",
                "D4417" => "3D Secure Error - Security verification failed",
                "D4419" => "Re-enter Last Transaction - Please try again",
                "D4421" => "No Action Taken - Transaction was not processed",
                "D4422" => "Suspected Malfunction - System error, please try again",
                "D4423" => "Unacceptable Transaction Fee - Transaction fee not acceptable",
                "D4425" => "Unable To Route Transaction - Routing error",
                "D4430" => "Format Error - Invalid data format",
                "D4431" => "Bank Not Supported - Your bank is not supported",
                "D4433" => "Expired Card - Your card has expired",
                "D4434" => "Suspected Fraud - Transaction flagged for security",
                "D4435" => "Contact Acquirer - Please contact your bank",
                "D4436" => "Restricted Card - Your card has been restricted",
                "D4437" => "Contact Acquirer Security - Please contact your bank",
                "D4438" => "PIN Tries Exceeded - Too many incorrect PIN attempts",
                "D4439" => "No Credit Account - Credit account not available",
                "D4440" => "Function Not Supported - Operation not supported",
                "D4441" => "Lost Card - Card reported as lost",
                "D4442" => "No Universal Account - Account not found",
                "D4443" => "Stolen Card - Card reported as stolen",
                "D4444" => "No Investment Account - Investment account not available",
                "D4450" => "Click to Pay Error - Digital wallet error",
                "D4451" => "Insufficient Funds - Not enough money in your account",
                "D4452" => "No Cheque Account - Cheque account not available",
                "D4453" => "No Savings Account - Savings account not available",
                "D4454" => "Expired Card - Your card has expired, please update",
                "D4455" => "Incorrect PIN - Wrong PIN entered",
                "D4456" => "No Card Record - Card not found in system",
                "D4457" => "Function Not Permitted - This operation is not allowed for your card",
                "D4458" => "Function Not Permitted to Terminal - Terminal restriction",
                "D4459" => "Suspected Fraud - Transaction blocked for security",
                "D4460" => "Contact Acquirer - Please contact your bank",
                "D4461" => "Exceeds Withdrawal Limit - Transaction exceeds your limit",
                "D4462" => "Restricted Card - Your card has restrictions",
                "D4463" => "Security Violation - Security check failed",
                "D4464" => "Original Amount Incorrect - Amount mismatch",
                "D4465" => "Withdrawal Frequency Limit Exceeded - Too many transactions",
                "D4466" => "Contact Acquirer Security - Please contact your bank",
                "D4467" => "Capture Card - Card needs to be captured",
                "D4475" => "PIN Tries Exceeded - Too many incorrect attempts",
                "D4476" => "Invalid Transaction Reference - Reference not valid",
                "D4481" => "Transaction Counter Exceeded - Transaction limit reached",
                "D4482" => "CVV Validation Error - Incorrect CVV/security code",
                "D4483" => "Acquirer Not Accepting Transactions - Please try again later",
                "D4484" => "Transaction Not Accepted - This transaction cannot be processed",
                "D4490" => "Cut Off In Progress - System maintenance in progress",
                "D4491" => "Card Issuer Unavailable - Bank system is unavailable",
                "D4492" => "Unable To Route Transaction - Routing error",
                "D4493" => "Violation Of Law - Transaction violates regulations",
                "D4494" => "Duplicate Transaction - This transaction was already processed",
                "D4495" => "Amex Declined - American Express declined",
                "D4496" => "System Error - System error occurred",
                "D4497" => "MasterPass Error - MasterPass wallet error",
                "D4498" => "PayPal Error - PayPal transaction error",
                "D4499" => "Invalid Transaction - Transaction cannot be authorized/voided",

                // Fraud Response Codes
                "F7000" => "Security Check - Additional verification required",
                "F7001" => "Security Review - Transaction under review",
                "F7002" => "Country Verification - Country mismatch detected",
                "F7003" => "High Risk Location - High risk country detected",
                "F7004" => "Proxy Detected - Anonymous proxy detected",
                "F7005" => "Proxy Detected - Transparent proxy detected",
                "F7006" => "Email Verification - Free email service detected",
                "F7007" => "International Transaction - International transaction flagged",
                "F7008" => "Risk Assessment - High risk score detected",
                "F7009" => "Transaction Blocked - Transaction denied by fraud rules",
                "F7010" => "PayPal Fraud Rules - Denied by PayPal fraud rules",
                "F9001" => "Custom Rule - Transaction blocked by custom fraud rule",
                "F9010" => "High Risk Billing Country - Billing country flagged",
                "F9011" => "High Risk Card Country - Card country flagged",
                "F9012" => "High Risk IP Address - IP address flagged",
                "F9013" => "High Risk Email - Email address flagged",
                "F9014" => "High Risk Shipping Country - Shipping country flagged",
                "F9015" => "Security Alert - Multiple cards for single email",
                "F9016" => "Security Alert - Multiple cards for single location",
                "F9017" => "Security Alert - Multiple emails for single card",
                "F9018" => "Security Alert - Multiple emails for single location",
                "F9019" => "Security Alert - Multiple locations for single card",
                "F9020" => "Security Alert - Multiple locations for single email",
                "F9021" => "Suspicious Name - First name flagged",
                "F9022" => "Suspicious Name - Last name flagged",
                "F9023" => "Transaction Declined - Fraud prevention",
                "F9024" => "Duplicate Detection - Multiple transactions same address/card",
                "F9025" => "Duplicate Detection - Multiple transactions same address/new card",
                "F9026" => "Duplicate Detection - Multiple transactions same email/new card",
                "F9027" => "Duplicate Detection - Multiple transactions same email/card",
                "F9028" => "Multiple Transactions - New credit card flagged",
                "F9029" => "Multiple Transactions - Known credit card flagged",
                "F9030" => "Multiple Transactions - Same email address",
                "F9031" => "Multiple Transactions - Same credit card",
                "F9032" => "Invalid Customer Name - Last name validation failed",
                "F9033" => "Invalid Billing Address - Billing street invalid",
                "F9034" => "Invalid Shipping Address - Shipping street invalid",
                "F9037" => "Suspicious Email - Email address flagged",
                "F9049" => "Genuine Customer - Customer verified",
                "F9050" => "High Risk - High risk email and amount",
                "F9059" => "No Liability Shift - 3D Secure liability issue",
                "F9113" => "Country Mismatch - Card country differs from IP country",

                // Validation Codes
                "V6000" => "Validation Error - Please check your details",
                "V6001" => "Invalid IP Address - Customer IP is invalid",
                "V6002" => "Invalid Device ID - Device ID is invalid",
                "V6010" => "Invalid Transaction Type - Account not certified for this type",
                "V6011" => "Invalid Amount - Total amount is invalid",
                "V6012" => "Invalid Invoice Description - Description is invalid",
                "V6013" => "Invalid Invoice Number - Invoice number is invalid",
                "V6014" => "Invalid Invoice Reference - Reference is invalid",
                "V6015" => "Invalid Currency - Currency code is invalid",
                "V6016" => "Payment Required - Payment information missing",
                "V6017" => "Currency Required - Currency code is required",
                "V6018" => "Unknown Currency - Currency code not recognized",
                "V6021" => "Cardholder Name Required - Please enter name on card",
                "V6022" => "Card Number Required - Please enter card number",
                "V6023" => "CVV Required - Please enter CVV/security code",
                "V6033" => "Invalid Card Number - Card number format is invalid",
                "V6034" => "Invalid Issue Number - Issue number is invalid",
                "V6035" => "Invalid Valid From Date - Valid from date is invalid",
                "V6041" => "Customer Required - Customer information is required",
                "V6042" => "First Name Required - Please enter first name",
                "V6043" => "Last Name Required - Please enter last name",
                "V6044" => "Country Required - Country code is required",
                "V6051" => "Invalid First Name - First name contains invalid characters",
                "V6052" => "Invalid Last Name - Last name contains invalid characters",
                "V6053" => "Invalid Country - Country code is invalid",
                "V6061" => "Invalid Customer Reference - Customer reference is invalid",
                "V6062" => "Invalid Company Name - Company name is invalid",
                "V6064" => "Invalid Street Address - Street address is invalid",
                "V6066" => "Invalid City - City is invalid",
                "V6067" => "Invalid State - State is invalid",
                "V6068" => "Invalid Postal Code - Postal code is invalid",
                "V6069" => "Invalid Email - Email address is invalid",
                "V6070" => "Invalid Phone - Phone number is invalid",
                "V6100" => "Invalid Card Name - Name on card is invalid",
                "V6101" => "Invalid Expiry Month - Month must be 01-12",
                "V6102" => "Invalid Expiry Year - Year format is invalid",
                "V6106" => "Invalid CVV - CVV/security code is invalid",
                "V6110" => "Invalid Card Number - Please check your card number",
                "V6111" => "Unauthorized - Account not PCI certified for direct card processing",
                "V6113" => "Invalid Refund - Transaction cannot be refunded",
                "V6114" => "Gateway Error - Gateway validation failed",
                "V6150" => "Invalid Refund Amount - Refund amount is invalid",
                "V6151" => "Refund Too Large - Refund exceeds original transaction",
                "V6152" => "Already Refunded - Transaction already fully refunded",
                "V6153" => "Card Type Not Supported - This card type is not accepted",
                "V6154" => "Insufficient Funds - Not enough funds for refund",

                // System Errors
                "S5000" => "System Error - Please try again later",
                "S5010" => "Gateway Error - Unknown gateway error",
                "S5011" => "PayPal Connection Error - PayPal unavailable",
                "S5014" => "Configuration Error - Merchant settings error",
                "S5020" => "Transaction Timeout - Transaction took too long",
                "S5029" => "Rate Limit Exceeded - Too many requests, please wait",
                "S5099" => "Transaction Incomplete - Transaction in progress",
                "S5666" => "Unknown State - Transaction in unknown state",

                // SDK Errors
                "S9990" => "Configuration Error - Invalid API endpoint",
                "S9991" => "Configuration Error - API credentials not set",
                "S9992" => "Connection Error - Cannot connect to payment gateway",
                "S9993" => "Authentication Error - Invalid API credentials",
                "S9995" => "Data Error - Invalid transaction data",
                "S9996" => "Server Error - Payment gateway server error",

                _ => $"Error Code: {responseCode} - Please contact support"
            };

            // Extract only the user-friendly message (part after the dash)
            var parts = fullDescription.Split(" - ", 2);
            return parts.Length > 1 ? parts[1] : fullDescription;
        }

        public static string GetUserFriendlyMessage(string? responseCode)
        {
            if (string.IsNullOrEmpty(responseCode))
                return "Payment could not be processed. Please try again or contact support.";

            // For fraud codes, show generic message
            if (responseCode.StartsWith("F"))
            {
                return "Your transaction could not be processed at this time. Please try again later or contact support.";
            }

            // For declined transactions
            if (responseCode.StartsWith("D"))
            {
                return responseCode switch
                {
                    "D4414" or "V6033" or "V6110" => "Please check your card number and try again.",
                    "D4454" or "D4433" => "Your card has expired. Please use a different card.",
                    "D4451" => "Your card has insufficient funds. Please use a different payment method.",
                    "D4455" => "Incorrect PIN entered. Please try again.",
                    "D4482" => "Incorrect CVV/security code. Please check the 3-digit code on the back of your card.",
                    "D4405" => "Your card was declined. Please contact your bank or try a different card.",
                    "D4441" or "D4443" => "This card cannot be used. Please use a different card.",
                    _ => "Your card was declined. Please contact your bank or try a different payment method."
                };
            }

            // For validation errors
            if (responseCode.StartsWith("V"))
            {
                return responseCode switch
                {
                    "V6033" or "V6110" => "Invalid card number. Please check and try again.",
                    "V6101" => "Invalid expiry month. Please enter a month between 01-12.",
                    "V6102" => "Invalid expiry year. Please check the expiry date.",
                    "V6106" => "Invalid CVV. Please enter the 3 or 4 digit security code.",
                    "V6111" => "Payment processing unavailable. Please contact support.",
                    "V6153" => "This card type is not accepted. Please use a different card.",
                    _ => "Please check your payment details and try again."
                };
            }

            // For system errors
            if (responseCode.StartsWith("S"))
            {
                return "A system error occurred. Please try again in a few moments.";
            }

            // Success codes
            if (responseCode.StartsWith("A"))
            {
                return "Payment successful!";
            }

            return "Payment could not be processed. Please try again or contact support.";
        }
    }
}
