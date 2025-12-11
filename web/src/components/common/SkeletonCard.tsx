export const SkeletonCard = () => {
    return (
        <div
            className="rounded-2xl p-6 border animate-pulse"
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.05)'
            }}
        >
            {/* Image placeholder */}
            <div
                className="w-full h-48 rounded-xl mb-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}
            />

            {/* Title placeholder */}
            <div
                className="h-6 rounded mb-3"
                style={{ background: 'rgba(255,255,255,0.08)', width: '70%' }}
            />

            {/* Subtitle placeholder */}
            <div
                className="h-4 rounded mb-4"
                style={{ background: 'rgba(255,255,255,0.05)', width: '50%' }}
            />

            {/* Price placeholder */}
            <div
                className="h-8 rounded"
                style={{ background: 'rgba(59,130,246,0.1)', width: '40%' }}
            />
        </div>
    )
}
