export default function CertificatesList({ platforms }) {
  const hr = platforms?.hackerrank?.data;
  const sr = platforms?.skillrack?.data;

  const hrCerts = hr?.certificates || [];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md h-full">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">
        Certificates
      </h3>

      <div className="space-y-3">
        {hrCerts.map((cert, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col transition-transform hover:translate-x-1">
            <span className="font-bold text-gray-800 text-sm">{cert.title || 'HackerRank Certificate'}</span>
            <span className="text-xs font-medium text-green-600 mt-0.5">HackerRank</span>
            <span className="text-[10px] text-gray-500 mt-1 uppercase font-semibold tracking-wide">Status: {cert.status || 'Verified'}</span>
          </div>
        ))}
        
        {sr?.certificates > 0 && (
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col transition-transform hover:translate-x-1">
            <span className="font-bold text-gray-800 text-sm">{sr.certificates} SkillRack Certificates</span>
            <span className="text-xs font-medium text-purple-600 mt-0.5">SkillRack</span>
            <span className="text-[10px] text-gray-500 mt-1 uppercase font-semibold tracking-wide">Platform Verified</span>
          </div>
        )}

        {hrCerts.length === 0 && (!sr?.certificates || sr.certificates === 0) && (
          <div className="text-center p-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg bg-gray-50">
            No certificates found.
          </div>
        )}
      </div>
    </div>
  );
}
