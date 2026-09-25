import DiceRoller from '../dashboard/DiceRoller/DiceRoller';

export default function Playground() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#888', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
        🛠️ Developer Playground
      </h2>
      
      {/* Sandbox Section for Component Testing */}
      <section style={{ marginTop: '2rem' }}>
        <DiceRoller />
      </section>
      
      {/* You can drop other components here as you build them */}
    </div>
  );
}
