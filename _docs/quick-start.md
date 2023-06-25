---
layout: single
title: "Quick Start"
classes: wide
---

## Installing AutoFixture

To add AutoFixture to your project you'll need to install the package from NuGet, using either the command line or the package manager in your IDE.

Here are some examples on how you can install the AutoFixture NuGet package.

### .NET CLI

```sh
> dotnet add package AutoFixture --version 4.13.0
```

### Package Manager

```ps
PM> Install-Package AutoFixture -Version 4.13.0
```

### Project File

```xml
<ItemGroup>
  <!--Other package references-->
  <PackageReference Include="AutoFixture" Version="4.11.0" />
</ItemGroup>
```

## Using AutoFixture

Now that the package is installed in your project, let's see how AutoFixture can help you write easier to understand and maintain unit-tests.

We will start from a *typical example* of a unit-test and refactor it to showcase most of the AutoFixture features.

```csharp
[Fact]
public void IntroductoryTest()
{
    // Arrange
    var someDto = new ClientDto
    {
      Id = 291293,
      Name = "John Doe",
      Age = 42
    };
    var mailComposerMock = new Mock<MailComposer>();
    mailComposerMock
      .Setup(c => c.Compose(It.IsAny<ClientDto>()))
      .Returns(new EmptyMail());
    var repositoryMock = new Mock<IRepository>();
    var loggerMock = new Mock<ILogger>();
    var sut = new MyService(
      mailComposerMock.Object,
      repositoryMock.Object,
      loggerMock.Object
    );

    // Act
    var result = sut.SendEmail(someDto);

    // Assert
    Assert.Equal(expectedNumber, result);
}
```

Right from the start we can notice that there is a lot going on in the `// Arrange` phase of the test. This will likely create a lot of work for anyone maintaining the code-base. Let's see how we can improve the test.

### Generating test data

First, we will introduce the `Fixture` class, that represents the entry point into AutoFixture, at the `// Arrange` phase:

```csharp
var fixture = new Fixture();
```

Next, we will use the fixture instance, to create our test data. To do this, we will replace the instantiation of the `ClientDto` class, with the following statement:

```csharp
var someDto = fixture.Create<ClientDto>();
```

As you can see we do not set explicitly any inline values on the `someDto` instance. That is because AutoFixture will by default, take care of providing data to the constructor and will fill in the data, all the public properties.

### Generating mocks

So far we have saved a few lines of code by generating our test data. Let's optimize the test further by getting rid of the mock instantiations.

To do this we will have to customize our fixture instance. Since we use `Moq` as our mocking framework we will use the `AutoFixture.AutoMoq` package to provide us with the necessary customization.

```csharp
var fixture = new Fixture().Customize(new AutoMoqCustomization());
```

Now AutoFixture will be able to create mocks as well as instances of Abstract types and interfaces.

Since our mocks will now be auto-generated we can go straight on and generate our SUT instance.

```csharp
var sut = fixture.Create<MyService>();
```

### Freezing values

The `sut` instance generates fine, but there is an issue now. We still have to provide the behavior to our `mailComposerMock` to maintain feature parity for our tests.

Luckily we can tell our fixture to "freeze" a particular type. This means that every time we request an instance of a frozen type, we will get the same instance. You can think of it as registering a singleton instance in an IoC container.

```csharp
var mailComposerMock = fixture.Freeze<Mock<MailComposer>>();
```

So far our code looks like this:

```csharp
[Fact]
public void IntroductoryTest()
{
    // Arrange
  var fixture = new Fixture()
    .Customize(new AutoMoqCustomization());
  var someDto = fixture.Create<ClientDto>();
  var mailComposerMock = fixture.Freeze<Mock<MailComposer>>();
  mailComposerMock
    .Setup(c => c.Compose(It.IsAny<ClientDto>()))
    .Returns(new EmptyMail());
  var sut = fixture.Create<MyService>();

  // Act
  var result = sut.SendEmail(someDto);

  // Assert
  Assert.Equal(expectedNumber, result);
}
```

This is a significant improvement over the code we had initially. Let's go on and improve it further.

### Injecting test data

Wouldn't it be nice if we could get rid of the boilerplate code for customizing our feature and explicitly requesting instances?

We can actually do this, by injecting our test data, directly into our test.
To do this, we'll have to first update our test, from a `[Fact]` to a `[Theory]`.

Next we'll make use of AutoFixture's `[AutoData]` attribute and extend it contain our customizations.

```csharp
public class AutoDomainDataAttribute : AutoDataAttribute
{
  public AutoDomainDataAttribute()
    :base(() => new Fixture().Customize(new AutoMoqCustomization()))
  {
  }
}
```

Now we're ready to use the attribute in order to inject the test data into our test.

```csharp
[Theory]
[AutoDomainData]
public void IntroductoryTest(
  [Frozen] Mock<MailComposer> mailComposerMock,
  MyService sut, ClientDto someDto, EmptyMail mail)
{
    // Arrange
  mailComposerMock
    .Setup(c => c.Compose(It.IsAny<ClientDto>()))
    .Returns(mail);

  // Act
  var result = sut.SendEmail(ClientDto);

  // Assert
  Assert.Equal(expectedNumber, result);
}
```

There we are, this is much more maintainable and easier to read.
