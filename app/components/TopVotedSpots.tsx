import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faThumbsUp } from '@fortawesome/free-solid-svg-icons';

interface UnreviewedSpot {
  id: string;
  name: string;
  address: string;
  votes: number;
  checkedOut: boolean;
}

interface TopVotedSpotsProps {
  spots: UnreviewedSpot[];
}

export function TopVotedSpots({ spots }: TopVotedSpotsProps) {
  const topSpots = [...spots]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  const positions = ['Next Up', 'On Deck', 'In The Hole'];
  const positionColors = ['text-deep-orange-600', 'text-deep-orange-500', 'text-deep-orange-400'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-[480px] flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faClipboardCheck} className="w-5 h-5 text-deep-orange-500" />
        Next to Review
      </h3>
      
      <div className="flex-1 space-y-3">
        {topSpots.map((spot, index) => (
          <div 
            key={spot.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-deep-orange-50/50 border border-deep-orange-100"
          >
            <div className="flex-1">
              <div className={`${positionColors[index]} text-sm font-medium mb-1`}>
                {positions[index]}
              </div>
              <h4 className="font-semibold text-gray-900">{spot.name}</h4>
              <p className="text-sm text-gray-600 mt-0.5">{spot.address}</p>
              <div className="flex items-center gap-1.5 mt-2 text-deep-orange-600">
                <FontAwesomeIcon icon={faThumbsUp} className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{spot.votes} votes</span>
              </div>
            </div>
          </div>
        ))}

        {topSpots.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 text-center">
              No spots have been voted on yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
