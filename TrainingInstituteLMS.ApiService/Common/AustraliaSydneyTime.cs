namespace TrainingInstituteLMS.ApiService.Common;

/// <summary>
/// Training runs on Australia/Sydney civil dates. <see cref="TrainingInstituteLMS.Data.Entities.Courses.CourseDate.ScheduledDate"/>
/// is stored as a calendar day for that region; filtering "today and future" must use Sydney midnight, not UTC.
/// </summary>
public static class AustraliaSydneyTime
{
    private static readonly TimeZoneInfo SydneyTz = ResolveSydneyTimeZone();

    private static TimeZoneInfo ResolveSydneyTimeZone()
    {
        foreach (var id in new[] { "Australia/Sydney", "AUS Eastern Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        throw new InvalidOperationException("Could not resolve Australia/Sydney time zone (tried IANA and Windows IDs).");
    }

    /// <summary>Current calendar date in Australia/Sydney (date component only, Unspecified kind).</summary>
    public static DateTime TodayDate
    {
        get
        {
            var utcNow = DateTime.UtcNow;
            var sydney = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utcNow, DateTimeKind.Utc), SydneyTz);
            return sydney.Date;
        }
    }
}
