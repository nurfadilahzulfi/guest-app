import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { masterDataService } from "@/infrastructure/storage/master-data-service";

export async function GET() {
  try {
    const list = await masterDataService.getPositions();
    return Response.json(list);
  } catch (error) {
    console.error("Get positions error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return Response.json({ error: "Nama jabatan wajib diisi" }, { status: 400 });
    }

    const list = await masterDataService.addPosition(name);
    return Response.json(list, { status: 201 });
  } catch (error) {
    console.error("Add position error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdministrator(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return Response.json({ error: "Nama jabatan wajib diisi" }, { status: 400 });
    }

    const list = await masterDataService.deletePosition(name);
    return Response.json(list);
  } catch (error) {
    console.error("Delete position error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

