namespace MomentRank.ValueTypes
{
    public readonly struct DateTimeRange : IEquatable<DateTimeRange>
    {
        public DateTime Start { get; }
        public DateTime End { get; }

        public DateTimeRange(DateTime start, DateTime end)
        {
            if (end < start)
            {
                throw new ArgumentException("End date must be after start date");
            }

            Start = start;
            End = end;
        }

        public TimeSpan Duration => End - Start;

        public bool Contains(DateTime dateTime)
        {
            return dateTime >= Start && dateTime <= End;
        }

        public bool IsActive(DateTime currentTime)
        {
            return Contains(currentTime);
        }

        public bool HasEnded(DateTime currentTime)
        {
            return currentTime > End;
        }

        public bool IsUpcoming(DateTime currentTime)
        {
            return currentTime < Start;
        }

        public bool Equals(DateTimeRange other)
        {
            return Start == other.Start && End == other.End;
        }

        public override bool Equals(object? obj)
        {
            return obj is DateTimeRange other && Equals(other);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Start, End);
        }

        public static bool operator ==(DateTimeRange left, DateTimeRange right)
        {
            return left.Equals(right);
        }

        public static bool operator !=(DateTimeRange left, DateTimeRange right)
        {
            return !left.Equals(right);
        }

        public override string ToString()
        {
            return $"{Start:g} - {End:g} ({Duration.TotalHours:F1}h)";
        }
    }
}
