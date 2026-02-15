# ABOUTME: Template for Homebrew cask definition, rendered by CI with version and SHA values.
# ABOUTME: Placeholders (__VERSION__, __SHA_ARM__, __SHA_INTEL__) are replaced via sed.

cask "steadi" do
  version "__VERSION__"

  on_arm do
    sha256 "__SHA_ARM__"
    url "https://github.com/Siddharth-Khattar/Steadi/releases/download/v#{version}/Steadi_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "__SHA_INTEL__"
    url "https://github.com/Siddharth-Khattar/Steadi/releases/download/v#{version}/Steadi_#{version}_x64.dmg"
  end

  name "Steadi"
  desc "Teleprompter app"
  homepage "https://github.com/Siddharth-Khattar/Steadi"

  livecheck do
    url "https://github.com/Siddharth-Khattar/Steadi/releases/latest"
    strategy :github_latest
  end

  depends_on macos: ">= :monterey"

  app "Steadi.app"

  postflight do
    system_command "/usr/bin/xattr",
                   args: ["-cr", "#{appdir}/Steadi.app"],
                   sudo: false
  end
end
