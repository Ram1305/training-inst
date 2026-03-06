using System.Text.Json;
using System.Text.Json.Serialization;
using TrainingInstituteLMS.ApiService.Services.Payment;

namespace TrainingInstituteLMS.ApiService.Tests;

public class EwayTransactionResponseDeserializationTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    [Theory]
    [InlineData("{\"TransactionStatus\":true}", true)]
    [InlineData("{\"TransactionStatus\":false}", false)]
    [InlineData("{\"TransactionStatus\":\"true\"}", true)]
    [InlineData("{\"TransactionStatus\":\"false\"}", false)]
    [InlineData("{\"TransactionStatus\":1}", true)]
    [InlineData("{\"TransactionStatus\":0}", false)]
    [InlineData("{\"TransactionStatus\":\"1\"}", true)]
    [InlineData("{\"TransactionStatus\":\"0\"}", false)]
    [InlineData("{\"TransactionStatus\":\"yes\"}", true)]
    [InlineData("{\"TransactionStatus\":\"no\"}", false)]
    [InlineData("{\"TransactionStatus\":\"SUCCESS\"}", true)]
    [InlineData("{\"TransactionStatus\":\"Completed\"}", true)]
    [InlineData("{\"TransactionStatus\":\"SomethingUnexpected\"}", false)]
    [InlineData("{\"TransactionStatus\":null}", false)]
    [InlineData("{\"TransactionStatus\":{}}", false)]
    [InlineData("{\"TransactionStatus\":[]}", false)]
    public void TransactionStatus_is_interpreted_safely_without_throwing(string json, bool expected)
    {
        var model = JsonSerializer.Deserialize<EwayTransactionResponse>(json, Options);
        Assert.NotNull(model);
        Assert.Equal(expected, model!.TransactionStatus);
    }
}
