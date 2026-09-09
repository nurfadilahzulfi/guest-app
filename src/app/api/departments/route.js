import { auth } from "@/infrastructure/auth/auth-options";
import { isAdministrator } from "@/domain/entities/user";
import { masterDataService } from "@/infrastructure/storage/master-data-service";

export async function GET() {
  try {
    const list = await masterDataService.getDepartments();
    return Response.json(list);
  } catch (error) {
    console.error("Get departments error:", error);
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
      return Response.json({ error: "Nama departemen wajib diisi" }, { status: 400 });
    }

    const list = await masterDataService.addDepartment(name);
    return Response.json(list, { status: 201 });
  } catch (error) {
    console.error("Add department error:", error);
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
      return Response.json({ error: "Nama departemen wajib diisi" }, { status: 400 });
    }

    const list = await masterDataService.deleteDepartment(name);
    return Response.json(list);
  } catch (error) {
    console.error("Delete department error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

