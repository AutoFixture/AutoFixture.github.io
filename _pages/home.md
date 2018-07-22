---
title: "Welcome"
layout: splash
permalink: /
---

⚠️⚠️⚠️ **Notice!** Site is under active development and is not fully ready yet 🔨👷

-----------
# Intro

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

AutoFixture offers integration with __xUnit__ and __NUnit__ making your unit tests even more concise:

```c#
[Theory, AutoData]
public void IntroductoryTest(int expectedNumber, MyClass sut)
{
    int result = sut.Echo(expectedNumber);
    Assert.Equal(expectedNumber, result);
}
```

AutoFixture also provides integration with popular mocking libraries (__NSubstitute__, __Moq__, __FakeItEasy__). See AutoFixture + xUnit + NSubstitute in action:

```c#
[Theory, AutoNSubstituteData] // Notice, AutoNSubstituteData __is not__ provided out of the box.
public void IntroductoryTest(int expectedNumber, INumberSource numberSource, MyClass sut)
{
    numberSource.Number.Returns(expectedNumber);
    
    int result = sut.Echo(numberSource);
    
    Assert.Equal(expectedNumber, result);
}
```
