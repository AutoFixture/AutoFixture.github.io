---
layout: splash
title: "Home"
permalink: /
---

## Overview

AutoFixture is a tool designed to make Test-Driven Development more productive and unit tests more refactoring-safe. It does so by removing the need for hand-coding anonymous variables as part of a test's Arrange phase:

```c#
[Fact]
public void IntroductoryTest()
{
    // Arrange
    Fixture fixture = new Fixture();

    int expectedNumber = fixture.Create<int>();
    MyClass sut = fixture.Create<MyClass>();
    // Act
    int result = sut.Echo(expectedNumber);
    // Assert
    Assert.Equal(expectedNumber, result);
}
```

This example illustrates the basic principle of AutoFixture: it can create values of virtually any type without the need for you to explicitly define which values should be used.

AutoFixture offers integration with **xUnit** and **NUnit** making your unit tests even more concise:

```c#
[Theory, AutoData]
public void IntroductoryTest(int expectedNumber, MyClass sut)
{
    int result = sut.Echo(expectedNumber);
    Assert.Equal(expectedNumber, result);
}
```

AutoFixture also provides integration with popular mocking libraries (**NSubstitute**, **Moq**, **FakeItEasy**). See AutoFixture + xUnit + NSubstitute in action:

```c#
[Theory, AutoNSubstituteData] // Notice, AutoNSubstituteData __is not__ provided out of the box.
public void IntroductoryTest(int expectedNumber, INumberSource numberSource, MyClass sut)
{
    numberSource.Number.Returns(expectedNumber);

    int result = sut.Echo(numberSource);

    Assert.Equal(expectedNumber, result);
}
```


## Integration Libraries

Additionally we provides a wide selection of integration libraries, that will help you take the most of AutoFixture, by integrating it with your unit-testing and mocking frameworks.

Currently we support most popular unit-testing and mocking frameworks in the .NET ecosystem (e.g. **xUnit**, **NUnit**, **Moq**, **NSubstitute** and more).

## Idiomatic assertions
