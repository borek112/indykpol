import { createDemoLoginResponse } from "../../api/demo-session";

export default async (req: Request) => createDemoLoginResponse(req);
