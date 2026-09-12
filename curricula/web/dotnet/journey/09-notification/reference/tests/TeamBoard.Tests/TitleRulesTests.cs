using TeamBoard.Domain;
namespace TeamBoard.Tests;
public class TitleRulesTests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("Review API", true)]
    public void Validity_matches_the_rule(string? value, bool expected) => Assert.Equal(expected, TitleRules.IsValid(value));
    [Theory]
    [InlineData(120, true)]
    [InlineData(121, false)]
    public void Length_is_checked_after_trimming(int length, bool expected) =>
        Assert.Equal(expected, TitleRules.IsValid(" " + new string('a', length) + " "));
}
