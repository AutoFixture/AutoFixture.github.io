---
layout: single
title: "Anonymous variables"
classes: wide
---

## Basic types

To ask AutoFixture for an object use the `Create<T>()` method. AutoFixture is capable of primitive types creation:

```c#
var fixture = new Fixture();

// Basic types
fixture.Create<bool>();
fixture.Create<char>();
fixture.Create<string>();

// Numeric types
fixture.Create<byte>();
fixture.Create<int>();
fixture.Create<double>();
fixture.Create<decimal>();
```

The most popular BCL types are supported as well:

```c#
fixture.Create<Guid>();
fixture.Create<DateTime>();
fixture.Create<CustomEnum>();
fixture.Create<MailAddress>();
fixture.Create<Uri>();
fixture.Create<int?>(); // All types are supported as nullable.
fixture.Create<Task>();
fixture.Create<Task<int>>();
fixture.Create<Func<int, int>>();
```

AutoFixture uses different strategies for different types. The primitive and popular BCL types are supported directly, however it's not possible to support all the types this way. Therefore, for the unknown types the generic approach is applied:

- Look for a public constructor or a static factory method (static method returning an instance of the current type).
- Resolve the constructor arguments and activate instance.
- Fill the writable public properties and fields (enabled by default; might be disabled via `fixture.OmitAutoProperties = true`) with generated values.

See example:

```c#
public class Identity
{
    public Guid Id { get; }

    public Identity(Guid id)
    {
        Id = id;
    }
}

public class Entity
{
    public Identity Id { get; }
    public string Value { get; set; }

    public Entity(Identity id)
    {
        Id = id;
    }
}

[Fact]
public void CreateComplexType()
{
    var fixture = new Fixture();

    var entity = fixture.Create<Entity>();

    Assert.NotNull(entity.Id);
    Assert.NotEqual(default, entity.Id.Id);
    Assert.NotNull(entity.Value);
}
```

In the sample above the whole object tree was recursively initialized with the generated values.

## Collections and sequences

AutoFixture recognizes the most popular collection and sequence types and returns non-empty results:

```c#
fixture.Create<IEnumerable<int>>();
fixture.Create<double[]>();
fixture.Create<List<int>>();
fixture.Create<Dictionary<byte, string>>();
fixture.Create<HashSet<int>>();
fixture.Create<ObservableCollection<int>>();
fixture.Create<IList<string>>();
fixture.Create<IReadOnlyCollection<string>>();
fixture.Create<IReadOnlyDictionary<string, long>>();
```

By default generated collections contain _many_ elements. The "many" size is controlled globally by the `fixture.RepeatCount` property. Currently the default is 3, but it's better to not rely on the exact value. If you need sequences with the exact number of elements, use the `CreateMany<T>()` extension method.

### CreateMany&lt;T&gt;()

AutoFixture ships with the `CreateMany<T>()` extension method to make it simpler create sequences:

```c#
IEnumerable<int> manyNumbers = fixture.CreateMany<int>();
IEnumerable<int> fiveNumbers = fixture.CreateMany<int>(count: 5);
```

If you write a test where the number of items does matter, it's always better to be explicit and use the `CreateMany<T>()` method.

## Summary

Usually AutoFixture tries to return the most expected value you might want to get. For instance, we try to avoid return of exceptional values as usually your code doesn't expect that:

- `null` value for the reference types
- empty strings
- throw exception in the generated delegates or tasks

As result the deeply initialized graph usually suits for the most scenarios. For the cases when it doesn't, please use the customization feature described in the further sections.
