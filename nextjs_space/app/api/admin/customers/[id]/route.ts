import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { name, email, phone, status, suspendReason, addressLine1, addressLine2, city, state, pincode } = body;

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.fullName = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (suspendReason !== undefined) updateData.suspendReason = suspendReason;

    await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update or Create Address if address fields are passed
    if (addressLine1 !== undefined || city !== undefined || pincode !== undefined) {
      const existingAddress = await prisma.address.findFirst({
        where: { userId: params.id },
      });

      const addrData = {
        fullName: name || existing.fullName || "Customer",
        phone: phone || existing.phone || "",
        addressLine1: addressLine1 ?? existingAddress?.addressLine1 ?? "",
        addressLine2: addressLine2 ?? existingAddress?.addressLine2 ?? "",
        city: city ?? existingAddress?.city ?? "Siwan",
        state: state ?? existingAddress?.state ?? "Bihar",
        pincode: pincode ?? existingAddress?.pincode ?? existingAddress?.zipCode ?? "",
        userId: params.id,
        isDefault: true,
      };

      if (existingAddress) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: addrData,
        });
      } else {
        await prisma.address.create({
          data: addrData,
        });
      }
    }

    // Sync active orders for this customer so Delivery Partner app gets updated phone/address
    if (phone !== undefined || addressLine1 !== undefined || city !== undefined || pincode !== undefined) {
      const userOrders = await prisma.order.findMany({
        where: { userId: params.id },
        include: { address: true },
      });

      for (const order of userOrders) {
        const orderStatus = order.status;
        if (
          orderStatus === "OUT_FOR_DELIVERY" ||
          orderStatus === "DISPATCHED" ||
          orderStatus === "READY_FOR_DISPATCH" ||
          orderStatus === "RETURN_REQUESTED" ||
          orderStatus === "RETURN_ACCEPTED" ||
          orderStatus === "PACKAGING_STARTED" ||
          orderStatus === "PACKAGING_COMPLETED"
        ) {
          if (order.address?.id) {
            await prisma.address.update({
              where: { id: order.address.id },
              data: {
                fullName: name || order.address.fullName,
                phone: phone !== undefined ? phone : order.address.phone,
                addressLine1: addressLine1 !== undefined ? addressLine1 : order.address.addressLine1,
                addressLine2: addressLine2 !== undefined ? addressLine2 : order.address.addressLine2,
                city: city !== undefined ? city : order.address.city,
                state: state !== undefined ? state : order.address.state,
                pincode: pincode !== undefined ? pincode : order.address.pincode,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to update user: " + e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to delete user: " + e.message }, { status: 500 });
  }
}
