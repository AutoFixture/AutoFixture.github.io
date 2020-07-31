# AutoFixture Documentation

This is the official AutoFixture documentation repository.

## Prerequisites

In order to be able to serve the documentation site locally you'll need to have installd a recent version of [Ruby DevKit](https://www.ruby-lang.org/en/documentation/installation/) and [Jekyll](https://jekyllrb.com/docs/installation/) on your environment.

```cmd
> ruby -v
ruby 2.7.1p83 (2020-03-31 revision a0c7c23c9c) [x64-mingw32]
```

```cmd
> jekyll -v
jekyll 3.8.7
```

## Setup

Once you have installed all the dependencies, open a new console window, navigate to the root repository folder and run the following command.

```cmd
> bundle install
```

This will restore all the depending gem files on your local machine.

## Debug

Once you have completed the steps above, you can run the documentation website locally, by executing the following command.

```cmd
> bundle exec jekyll serve
```

This will start a local server which will serve the documentation on `http://127.0.0.1:4000`.

## Troubleshooting

### I am having issues installing dependencies on Windows

In case you have installed the Ruby DevKit using [RubyInstaller](https://rubyinstaller.org/), please make sure you have used the following option `3 - MSYS and MINGW development toolchain` and then re-run the dependencies restore command.

To update the selected installation option run the command below and when prompted, select the appropriate option.

```cmd
> ridk install
```
