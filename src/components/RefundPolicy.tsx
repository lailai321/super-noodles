const items = [
  'All refunds are processed in-store as cash.',
  'If an item is unavailable, our staff will inform you and provide a full cash refund at pickup.',
  'For any issues with your order, please call us at (02) 4733 4782 or speak to our staff at pickup.',
]

export default function RefundPolicy() {
  return (
    <div style={{
      background: '#F7F7F7', borderRadius: 8, border: '1px solid #EEEEEE',
      padding: '16px 20px', marginTop: 24,
    }}>
      <p style={{ fontFamily: "'BudgePair', sans-serif", fontWeight: 700, fontSize: '0.875rem', color: '#1A1A1A', marginBottom: 10 }}>
        Refund Policy
      </p>
      <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, listStyleType: 'decimal' }}>
        {items.map((text, i) => (
          <li key={i} style={{ fontFamily: "'BudgePair', sans-serif", fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
            {text}
          </li>
        ))}
      </ol>
    </div>
  )
}
