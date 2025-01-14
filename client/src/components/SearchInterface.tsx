import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Download } from "lucide-react"

type SearchResult = {
  name: string
  email: string
  phone: string
  website: string
}
export function SearchInterface() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleExportCSV() {
    // Préparer les données CSV
    const csvHeader = ["Nom", "Email", "Téléphone", "Site web"].join(",")
    const csvRows = results.map((result: SearchResult) => {
      return [
        `"${result.name || ""}"`,
        `"${result.email || ""}"`,
        `"${result.phone || ""}"`,
        `"${result.website || ""}"`,
      ].join(",")
    })
    const csvString = [csvHeader, ...csvRows].join("\n")

    // Créer le blob et le lien de téléchargement
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    // Configurer et déclencher le téléchargement
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `resultats_${query.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResults([]) // Reset results

    const evtSource = new EventSource(
      // `${import.meta.env.VITE_API_URL}/scrape-stream?query=${encodeURIComponent(
      //   query
      // )}`
      `http://localhost:5001/api/scrape-stream?query=${encodeURIComponent(
        query
      )}`
    )

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.error) {
        setError(data.error)
        evtSource.close()
        setIsLoading(false)
        return
      }

      if (data.results) {
        // @ts-expect-error "results" is always an array
        setResults((prev) => [...prev, ...data.results])
      }

      if (data.status === "completed") {
        evtSource.close()
        setIsLoading(false)
      }
    }

    evtSource.onerror = () => {
      // @ts-expect-error "results" is always an array
      setError("Erreur de connexion au serveur")
      evtSource.close()
      setIsLoading(false)
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>Recherche Google Maps</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className='space-y-4'>
            <div className='flex gap-2'>
              <Input
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Entrez votre recherche...'
                className='flex-1'
              />
              <Button type='submit' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Recherche...
                  </>
                ) : (
                  "Rechercher"
                )}
              </Button>
              {results.length > 0 && !isLoading && (
                <Button
                  type='button'
                  onClick={handleExportCSV}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <Download className='mr-2 h-4 w-4' />
                  CSV
                </Button>
              )}
              <Button
                className={`bg-purple-600 ${isLoading ? "flex" : "hidden"}`}
                onClick={() => {}}
              >
                Stopper la recherche
              </Button>
            </div>
          </form>

          {error && (
            <div className='mt-4 p-4 bg-red-50 text-red-600 rounded-md'>
              {error}
            </div>
          )}

          <div className='mt-6 space-y-4'>
            {isLoading && (
              <div className='text-center text-gray-500'>
                Recherche en cours... {results.length} résultats trouvés
              </div>
            )}

            <div className='grid gap-4'>
              {results.length > 0 && (
                <div className='text-center text-gray-500'>
                  {results.length} résultats trouvés
                </div>
              )}
              {results.map((result: SearchResult, index) => (
                <Card key={index} className='p-4'>
                  <h3 className='font-medium'>{result.name}</h3>
                  {result.phone && <p>Téléphone: {result.phone}</p>}
                  {result.email && <p>Email: {result.email}</p>}
                  {result.website && (
                    <p>
                      <a
                        href={result.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:underline'
                      >
                        Site web
                      </a>
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
