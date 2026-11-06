import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import WrittenStudioClient from "./written-studio-client";
export const dynamic="force-dynamic";
export default async function AdminWrittenStudioPage(){await requireAdminPermission("social.manage");return <Container className="py-8"><WrittenStudioClient/></Container>;}
