function badgeEmoji(rank) {
	if (rank === 1) return "🏆";
	if (rank === 2) return "🥈";
	return "🥉";
}

export default function VolunteerCard({ item }) {
	return (
		<article className="leader-row">
			<span className="leader-rank">#{item.rank}</span>
			<span className="leader-code">{item.code}</span>
			<div>
				<p className="need-title">{item.name}</p>
				<p className="need-meta">
					{item.xp.toLocaleString()} XP · {item.tasks} tasks
				</p>
			</div>
			<span>{badgeEmoji(item.rank)}</span>
		</article>
	);
}
