import { Badge, Card } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export function ComingSoon({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <>
      <h1>{title}</h1>
      <Card style={{ maxWidth: 560, marginTop: 24 }}>
        <Badge>Coming soon</Badge>
        <p style={{ marginTop: 12 }}>{description}</p>
        <p className="sm mut" style={{ marginTop: 8 }}>
          Planned for {phase}. Nothing is available to use here yet, and no sample results are shown.
        </p>
        <div className="row">
          <LinkButton href="/profile" variant="outline">
            Review your profile
          </LinkButton>
        </div>
      </Card>
    </>
  );
}
