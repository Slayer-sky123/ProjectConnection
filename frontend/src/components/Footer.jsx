import { FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      className="bg-white mt-4"
      style={{ color: "#091057", borderTop: "1px solid #DBD3D3" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-sm">
        {/* Brand */}
        <div>
          <h3 className="text-xl font-bold mb-3">
            Sprout<span style={{ color: "#EC8305" }}>you</span>
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(9,16,87,0.72)" }}>
            A trusted bridge between students, universities, and companies—focused on outcomes,
            portfolios, and real-world opportunities.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-base font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-[13px]" style={{ color: "rgba(9,16,87,0.72)" }}>
            <li>
              <a href="/about" className="hover:text-[#024CAA] transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="/blog" className="hover:text-[#024CAA] transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="/help" className="hover:text-[#024CAA] transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-[#024CAA] transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-base font-semibold mb-3">Resources</h4>
          <ul className="space-y-2 text-[13px]" style={{ color: "rgba(9,16,87,0.72)" }}>
            <li>
              <a href="/universities" className="hover:text-[#024CAA] transition-colors">
                Universities
              </a>
            </li>
            <li>
              <a href="/companies" className="hover:text-[#024CAA] transition-colors">
                Companies
              </a>
            </li>
            <li>
              <a href="/toolkit" className="hover:text-[#024CAA] transition-colors">
                Student Toolkit
              </a>
            </li>
            <li>
              <a href="/faqs" className="hover:text-[#024CAA] transition-colors">
                FAQs
              </a>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-base font-semibold mb-3">Connect</h4>
          <p className="text-[13px] mb-3" style={{ color: "rgba(9,16,87,0.72)" }}>
            Stay updated with product releases, hiring drives, and career playbooks.
          </p>
          <div
            className="flex space-x-3 text-sm"
            style={{ color: "rgba(9,16,87,0.80)" }}
          >
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-full border border-[#E3E4EF] grid place-items-center hover:bg-[#024CAA] hover:text-white transition-colors"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-full border border-[#E3E4EF] grid place-items-center hover:bg-[#024CAA] hover:text-white transition-colors"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-full border border-[#E3E4EF] grid place-items-center hover:bg-[#024CAA] hover:text-white transition-colors"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>

      <div
        style={{ borderTop: "1px solid #DBD3D3" }}
        className="py-4 text-center text-xs"
      >
        <span style={{ color: "rgba(9,16,87,0.6)" }}>
          © {new Date().getFullYear()} Sproutyou. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
