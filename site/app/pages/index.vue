<script setup lang="ts">
const { defaultApiPath } = useApiCatalog()

useSeoMeta({
  title: 'AutoFixture',
  description:
    'AutoFixture makes unit tests more productive by creating anonymous test data for .NET.',
})

const exampleCode = `[Theory, ShippingData]
public void CreateLabel_ForExistingOrder_IncludesShippingDetails(
    [Frozen] Mock<ICommerceOrderRepository> repository,
    [Greedy][Frozen(Matching.ImplementedInterfaces)] ShippingRateCalculator calculator,
    ShippingLabelService sut,
    Order order)
{
    repository
        .Setup(r => r.GetById(order.Id))
        .Returns(order);

    var label = sut.CreateLabel(order.Id);

    Assert.Contains(order.ShippingAddress.Name, label);
    Assert.Contains(order.ShippingAddress.Country, label);
    Assert.Contains("Weight: 2.5 kg", label);
}`

const installCode = 'dotnet add package AutoFixture'

const features = [
  {
    icon: 'i-lucide-sparkles',
    title: 'Anonymous test data',
    description: 'Create strings, numbers, and nested objects without hand-written arrange code.',
    to: '/docs/fundamentals/fixture-and-create',
  },
  {
    icon: 'i-lucide-wrench',
    title: 'Build DSL',
    description: 'Pin properties and satisfy business rules when Create is not enough.',
    to: '/docs/fundamentals/build-dsl',
  },
  {
    icon: 'i-lucide-git-branch',
    title: 'Object graphs',
    description: 'Fill constructors and properties across nested types in one call.',
    to: '/docs/fundamentals/specimen-graphs',
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: 'Customizations',
    description: 'Register factories and customize composers for fixture-wide defaults.',
    to: '/docs/fundamentals/customizations',
  },
  {
    icon: 'i-lucide-plug',
    title: 'Integrations',
    description: 'Works with xUnit.net 3, NUnit 4, Moq, NSubstitute, and FakeItEasy.',
    to: '/docs/integrations',
  },
  {
    icon: 'i-lucide-code-xml',
    title: 'API reference',
    description: 'Browse generated docs for every public type across AutoFixture packages.',
    to: defaultApiPath(),
  },
]
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-default">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--ui-primary)_18%,transparent),transparent_55%)]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />

      <UContainer class="relative py-20 sm:py-28 lg:py-32">
        <div class="mx-auto max-w-3xl text-center">
          <div class="hero-rise mb-8 flex justify-center">
            <AppLogo class="!h-10 w-auto" />
          </div>

          <h1 class="hero-rise hero-rise--delay-1 text-4xl font-bold tracking-tight text-pretty text-highlighted sm:text-6xl">
            Write tests.
            <span class="text-primary">Skip the arrange noise.</span>
          </h1>

          <p class="hero-rise hero-rise--delay-2 mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted sm:text-xl/8">
            AutoFixture creates anonymous test data for .NET so your unit tests stay focused on behavior, not boilerplate setup.
          </p>

          <div class="hero-rise hero-rise--delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
            <UButton
              to="/docs/get-started/introduction"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
            >
              Get started
            </UButton>
            <UButton
              :to="defaultApiPath()"
              size="xl"
              color="neutral"
              variant="outline"
            >
              API reference
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <UContainer class="py-16 sm:py-20">
      <div class="mx-auto max-w-3xl">
        <h2 class="text-center text-2xl font-semibold text-highlighted sm:text-3xl">
          Keep tests expressive, flexible, and useful
        </h2>
        <p class="mt-3 text-center text-muted">
          AutoFixture fills object graphs and dependencies — you focus on behavior, not boilerplate setup.
        </p>

        <LandingCodeBlock
          class="mt-8 max-w-3xl mx-auto"
          label="C#"
          lang="csharp"
          :code="exampleCode"
        />
      </div>
    </UContainer>

    <UContainer class="border-t border-default py-16 sm:py-20">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
          What you get
        </h2>
        <p class="mt-3 text-muted">
          From quick one-off specimens to constrained graphs and framework integrations.
        </p>
      </div>

      <UPageGrid class="mt-12">
        <UPageFeature
          v-for="feature in features"
          :key="feature.title"
          orientation="vertical"
          v-bind="feature"
        />
      </UPageGrid>
    </UContainer>

    <UContainer class="border-t border-default py-16 sm:py-20">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
          Ready to try it?
        </h2>
        <p class="mt-3 text-muted">
          Install the package and follow the get-started path — or jump straight into the API reference.
        </p>

        <LandingCodeBlock
          class="mt-8"
          label="Terminal"
          lang="shell"
          :code="installCode"
        />

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <UButton
            to="/docs/get-started/installation"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
          >
            Install and set up
          </UButton>
          <UButton
            to="/docs/get-started/introduction"
            size="lg"
            color="neutral"
            variant="outline"
          >
            Read the docs
          </UButton>
        </div>
      </div>
    </UContainer>

    <UContainer class="border-t border-default py-12 sm:py-16">
      <div class="mx-auto flex max-w-md items-center justify-center gap-4">
        <a
          href="https://dotnetfoundation.org/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label=".NET Foundation"
          class="shrink-0"
        >
          <img
            src="/dotnet-foundation.svg"
            alt=".NET Foundation logo"
            class="h-16 w-16"
            width="64"
            height="64"
          >
        </a>
        <p class="text-sm text-muted">
          AutoFixture is supported by the
          <a
            href="https://dotnetfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-highlighted underline-offset-2 hover:underline"
          >
            .NET Foundation
          </a>
        </p>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.hero-rise {
  animation: hero-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hero-rise--delay-1 {
  animation-delay: 80ms;
}

.hero-rise--delay-2 {
  animation-delay: 160ms;
}

.hero-rise--delay-3 {
  animation-delay: 240ms;
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-rise {
    animation: none;
  }
}
</style>
