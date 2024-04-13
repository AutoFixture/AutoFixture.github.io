---
layout: single
title: "Fixture customization"
classes: wide
---

AutoFixture is designed around the 80-20 (Pareto) principle. It is expected that the default `Fixture` instance will be able to create specimens witout too much trouble, in most cases. However there are situations, where AutoFixture needs some extra help.

- When a class consumes an interface, the default `Fixture` will not be able to create an instance. (Solved with AutoMocking Customizations)
- When the API has circular references, Fixture might enter an infinite recursion.
- When constructors accept only arguments that don't fit with the default specimens created by the `Fixture`.

To address these special cases, AutoFixture offers extension points, allowing client code to customize the default behavior.

AutoFixture also offers an idiomatic way to encapsulate these customizations and also keep the code DRY, called _Customizations_. This concept corresponds closely to modularization APIs of seveal well-known DI containers, like Castle Windsor's _Installers_ or Autofac's _Modules_.

## Implementing customizations

Customizations are simply implementations of the `ICustomization` interface, that requires clients to implement a single method `Customize`. The method receives a single argument, which is the `Fixture` instance itself.

```csharp
public interface ICustomization
{
    void Customize(IFixture fixture);
}
```

Anything that can be done using the `Fixture` instance can also be done with the `IFixture` instance passed in the customization.

## Using customizations

Customizing AutoFixture using _Customizations_ is a simple and straight-forward process. All that is necessary is to provide the `Fixture` an implementation of the `ICustomization` interface, using the `Customize` method.

```csharp
var fixture = new Fixture()
    .Customize(new AutoMoqCustomization());
```

In the example above, the `Fixture` instance is customized by the client code using the `AutoMoqCustomization` provided in the [AutoFixture.AutoMoq](https://www.nuget.org/packages/AutoFixture.AutoMoq/) package. Note that almost every extension library provided by AutoFixture offers at least one Customization.

## Reusing customizations

By design customizations are intended to be small in scope, reusable and composable. Whenever implementing a custom customization, it is recommended to adhere to the DRY principle and avoid defining all the configuration inside a single customization instance.

To be able to use multiple atomic customizations it is recommended to use the composite pattern. For convenience AutoFixture offers the `CompositeCustomization` class that implements the composite pattern for the `ICustomization` interface.

```csharp
var fixture = new Fixture()
    .Customize(new CompositeCustomization(
      new AutoMoqCustomization(),
      new NullRecursionCustomization(),
      new CustomersCustomization()
    ));
```

Composite customizations can also be implemented by inheriting from `CompositeCustomization`. This offers the benefit of having descriptive names for sets of related customizations.

```csharp
class DomainCustomization : CompositeCustomization
{
  public DomainCustomization()
    : base(
        new CustomersCustomization(),
        new AddressCustomization())
  {
  }
}
```
