---
layout: single
title:  "Welcome to AutoFixture documentation site"
classes: wide
---
This is intro doc.

And here is the basic usage example:

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
