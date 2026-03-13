import { MapPin, Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#001840] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#F5C400] w-10 h-10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#001840]" />
              </div>
              <div>
                <h3 className="font-bold text-xl">UniNav</h3>
                <p className="text-xs text-[#FFDC5F]">Eastern Mindoro College</p>
              </div>
            </div>
            <p className="text-[#FFFDF0] text-sm leading-relaxed">
              Your intelligent admission and campus navigation companion powered by NLP and AR technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-[#F5C400]">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Admissions
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Campus Map
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  About UniNav
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-[#F5C400]">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Enrollment Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Requirements
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-[#FFFDF0] hover:text-[#FFDC5F] transition-colors duration-200">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-[#F5C400]">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[#FFFDF0] text-sm">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-[#FFDC5F]" />
                <span>Eastern Mindoro College<br />Calapan City, Oriental Mindoro</span>
              </li>
              <li className="flex items-center gap-2 text-[#FFFDF0] text-sm">
                <Mail className="w-4 h-4 flex-shrink-0 text-[#FFDC5F]" />
                <a href="mailto:info@emc.edu.ph" className="hover:text-[#FFDC5F] transition-colors duration-200">
                  info@emc.edu.ph
                </a>
              </li>
              <li className="flex items-center gap-2 text-[#FFFDF0] text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-[#FFDC5F]" />
                <span>(043) 123-4567</span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                className="bg-[#102A71] hover:bg-[#F5C400] w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 group"
              >
                <Facebook className="w-4 h-4 text-[#FFFDF0] group-hover:text-[#001840]" />
              </a>
              <a
                href="#"
                className="bg-[#102A71] hover:bg-[#F5C400] w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 group"
              >
                <Twitter className="w-4 h-4 text-[#FFFDF0] group-hover:text-[#001840]" />
              </a>
              <a
                href="#"
                className="bg-[#102A71] hover:bg-[#F5C400] w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 group"
              >
                <Instagram className="w-4 h-4 text-[#FFFDF0] group-hover:text-[#001840]" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-[#102A71] pt-8">
          <div className="bg-[#102A71] p-4 rounded-lg mb-6">
            <p className="text-[#FFFDF0] text-sm text-center">
              <span className="font-semibold text-[#FFDC5F]">Disclaimer:</span> UniNav is an informational and navigational support tool and does not replace official enrollment systems or procedures.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#FFFDF0]">
            <p>© {currentYear} Eastern Mindoro College. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#FFDC5F] transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#FFDC5F] transition-colors duration-200">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
