import NotFoundClient from "@/components/not-found-client"

type RecentProject = { id: string; name: string }

export default function NotFound() {
  // Provide initial values for the client component
  const initialRecent: RecentProject[] = []
  const initialUrl = ""
  const initialReferrer = ""
  const initialTimestamp = new Date().toLocaleString()

  return (
    <NotFoundClient
      recent={initialRecent}
      currentUrl={initialUrl}
      referrer={initialReferrer}
      timestamp={initialTimestamp}
    />
  )
}
