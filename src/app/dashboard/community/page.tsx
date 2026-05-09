import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Video } from "lucide-react";

const groups = [
  { name: "Calculus Study Circle", members: 18, status: "Live in 20 min" },
  { name: "Chemistry Problem Solvers", members: 12, status: "3 new threads" },
  { name: "History Essay Workshop", members: 9, status: "Draft review" },
];

export default function CommunityPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">Join study groups, ask questions, and review with classmates.</p>
        </div>
        <Button className="gap-2">
          <Users className="h-4 w-4" />
          Find group
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.name} className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant="secondary">{group.members}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{group.status}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Open
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Video className="h-4 w-4" />
                  Meet
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
