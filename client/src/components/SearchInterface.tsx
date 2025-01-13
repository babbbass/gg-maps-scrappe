import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

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

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      //@ts-expect-error "type unknown"
      setError(err.message)
    } finally {
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
            </div>
          </form>

          {error && (
            <div className='mt-4 p-4 bg-red-50 text-red-600 rounded-md'>
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className='mt-6 space-y-4'>
              <h2 className='text-xl font-semibold'>Résultats</h2>
              <div className='grid gap-4'>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
