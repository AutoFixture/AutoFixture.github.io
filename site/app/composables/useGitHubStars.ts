export function useGitHubStars() {
  const { data } = useFetch(GITHUB_REPO_API, {
    key: 'github-stars',
    server: false,
    lazy: true,
    headers: {
      Accept: 'application/vnd.github+json',
    },
    transform: (repo: { stargazers_count: number }) => repo.stargazers_count,
  })

  const formattedStarCount = computed(() => {
    if (data.value == null) return undefined
    return formatCompactCount(data.value)
  })

  return {
    repoUrl: GITHUB_REPO_URL,
    formattedStarCount,
  }
}
