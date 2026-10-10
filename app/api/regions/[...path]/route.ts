import { NextResponse } from "next/server"

const EMSIFA_BASE_URL =
  "https://emsifa.github.io/api-wilayah-indonesia/api"

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { path } = await context.params

    if (!path || path.length === 0) {
      return NextResponse.json(
        {
          message: "Endpoint wilayah tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const endpoint = path.join("/")

    const response = await fetch(
      `${EMSIFA_BASE_URL}/${endpoint}`,
      {
        next: {
          revalidate: 86400,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            "Gagal mengambil data wilayah dari server sumber",
        },
        {
          status: response.status,
        }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error(
      "Region API Error:",
      error
    )

    return NextResponse.json(
      {
        message:
          "Gagal memuat data wilayah",
      },
      {
        status: 500,
      }
    )
  }
}